package com.mplads.geotrack.utils

import androidx.exifinterface.media.ExifInterface
import java.io.File
import java.io.FileDescriptor
import java.text.SimpleDateFormat
import java.util.*

object ExifUtils {

    fun embedGpsExif(
        file: File,
        latitude: Double,
        longitude: Double,
        date: Date = Date()
    ) {
        try {
            val exif = ExifInterface(file.absolutePath)
            writeExifAttributes(exif, latitude, longitude, date)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun embedGpsExif(
        fd: FileDescriptor,
        latitude: Double,
        longitude: Double,
        date: Date = Date()
    ) {
        try {
            val exif = ExifInterface(fd)
            writeExifAttributes(exif, latitude, longitude, date)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun writeExifAttributes(
        exif: ExifInterface,
        latitude: Double,
        longitude: Double,
        date: Date
    ) {
        // Latitude
        val latRef = if (latitude >= 0) "N" else "S"
        exif.setAttribute(ExifInterface.TAG_GPS_LATITUDE, decimalToDMS(latitude))
        exif.setAttribute(ExifInterface.TAG_GPS_LATITUDE_REF, latRef)

        // Longitude
        val lonRef = if (longitude >= 0) "E" else "W"
        exif.setAttribute(ExifInterface.TAG_GPS_LONGITUDE, decimalToDMS(longitude))
        exif.setAttribute(ExifInterface.TAG_GPS_LONGITUDE_REF, lonRef)

        // Date & Time formatting: "YYYY:MM:DD HH:MM:SS"
        val exifDateFormat = SimpleDateFormat("yyyy:MM:dd HH:mm:ss", Locale.US)
        val dateStr = exifDateFormat.format(date)
        exif.setAttribute(ExifInterface.TAG_DATETIME, dateStr)
        exif.setAttribute(ExifInterface.TAG_DATETIME_ORIGINAL, dateStr)
        exif.setAttribute(ExifInterface.TAG_DATETIME_DIGITIZED, dateStr)

        // App Software metadata
        exif.setAttribute(ExifInterface.TAG_SOFTWARE, "Marga-eyes")

        exif.saveAttributes()
    }

    private fun decimalToDMS(decimal: Double): String {
        val absolute = Math.abs(decimal)
        val degrees = absolute.toInt()
        val minutesNotTruncated = (absolute - degrees) * 60.0
        val minutes = minutesNotTruncated.toInt()
        val seconds = ((minutesNotTruncated - minutes) * 60.0 * 10000.0).toLong()

        return "$degrees/1,$minutes/1,$seconds/10000"
    }
}
