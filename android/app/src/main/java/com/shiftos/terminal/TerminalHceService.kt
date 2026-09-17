package com.shiftos.terminal

import android.nfc.cardemulation.HostApduService
import android.os.Bundle
import android.util.Log
import java.io.ByteArrayOutputStream

private const val TAG = "ShiftOSHce"

private val AID_NDEF_APP = byteArrayOf(
    0xD2.toByte(), 0x76, 0x00, 0x00, 0x85.toByte(), 0x01, 0x01,
)
private val CC_FAJL_ID = byteArrayOf(0xE1.toByte(), 0x03)
private val NDEF_FAJL_ID = byteArrayOf(0xE1.toByte(), 0x04)

private val SW_OK = byteArrayOf(0x90.toByte(), 0x00)
private val SW_FAJL_NIJE_NADJEN = byteArrayOf(0x6A, 0x82.toByte())
private val SW_POGRESNI_PARAMETRI = byteArrayOf(0x6B, 0x00)
private val SW_INSTRUKCIJA_NEPODRZANA = byteArrayOf(0x6D, 0x00)

class TerminalHceService : HostApduService() {

    private var selektovanFajl: ByteArray? = null

    override fun processCommandApdu(apdu: ByteArray?, extras: Bundle?): ByteArray {
        if (apdu == null || apdu.size < 4) return SW_POGRESNI_PARAMETRI

        return when (apdu[1]) {
            0xA4.toByte() -> obradiSelect(apdu)
            0xB0.toByte() -> obradiReadBinary(apdu)
            else -> SW_INSTRUKCIJA_NEPODRZANA
        }
    }

    private fun obradiSelect(apdu: ByteArray): ByteArray {
        if (apdu.size < 5) return SW_POGRESNI_PARAMETRI
        val p1 = apdu[2]
        val lc = apdu[4].toInt() and 0xFF
        if (apdu.size < 5 + lc) return SW_POGRESNI_PARAMETRI
        val podaci = apdu.copyOfRange(5, 5 + lc)

        return when {
            p1 == 0x04.toByte() && podaci.contentEquals(AID_NDEF_APP) -> {
                selektovanFajl = null
                SW_OK
            }
            p1 == 0x00.toByte() && podaci.contentEquals(CC_FAJL_ID) -> {
                selektovanFajl = ccFajl()
                SW_OK
            }
            p1 == 0x00.toByte() && podaci.contentEquals(NDEF_FAJL_ID) -> {
                selektovanFajl = ndefFajl()
                SW_OK
            }
            else -> SW_FAJL_NIJE_NADJEN
        }
    }

    private fun obradiReadBinary(apdu: ByteArray): ByteArray {
        val fajl = selektovanFajl ?: return SW_FAJL_NIJE_NADJEN
        if (apdu.size < 4) return SW_POGRESNI_PARAMETRI
        val offset = ((apdu[2].toInt() and 0xFF) shl 8) or (apdu[3].toInt() and 0xFF)
        val le = if (apdu.size > 4) (apdu[4].toInt() and 0xFF).let { if (it == 0) 256 else it } else 256

        if (offset > fajl.size) return SW_POGRESNI_PARAMETRI
        val kraj = minOf(fajl.size, offset + le)
        return fajl.copyOfRange(offset, kraj) + SW_OK
    }

    private fun ccFajl(): ByteArray {
        val ndefLen = ndefFajl().size
        return byteArrayOf(
            0x00, 0x0F,
            0x20,
            0x00, 0xFF.toByte(),
            0x00, 0xFF.toByte(),
            0x04, 0x06,
            0xE1.toByte(), 0x04,
            ((ndefLen shr 8) and 0xFF).toByte(), (ndefLen and 0xFF).toByte(),
            0x00,
            0xFF.toByte(),
        )
    }

    private fun ndefFajl(): ByteArray {
        val poruka = izgradiNdefTekstPoruku(TerminalIdentitet.terminalId ?: "")
        val izlaz = ByteArrayOutputStream()
        izlaz.write((poruka.size shr 8) and 0xFF)
        izlaz.write(poruka.size and 0xFF)
        izlaz.write(poruka)
        return izlaz.toByteArray()
    }

    private fun izgradiNdefTekstPoruku(tekst: String): ByteArray {
        val jezik = "en".toByteArray(Charsets.US_ASCII)
        val sadrzaj = tekst.toByteArray(Charsets.UTF_8)
        val payload = ByteArrayOutputStream()
        payload.write(jezik.size)
        payload.write(jezik)
        payload.write(sadrzaj)
        val payloadBajtovi = payload.toByteArray()

        val zapis = ByteArrayOutputStream()
        zapis.write(0xD1)
        zapis.write(1)
        zapis.write(payloadBajtovi.size)
        zapis.write('T'.code)
        zapis.write(payloadBajtovi)
        return zapis.toByteArray()
    }

    override fun onDeactivated(reason: Int) {
        Log.d(TAG, "HCE deaktiviran, razlog=$reason")
        selektovanFajl = null
    }
}
