package com.mplads.geotrack.utils

import android.graphics.*
import java.io.File
import java.io.FileOutputStream

object OverlayUtils {

    /**
     * Draws a visible geotag watermark badge onto the source Bitmap and returns the watermarked Bitmap.
     */
    fun drawWatermarkOnBitmap(
        sourceBitmap: Bitmap,
        latitude: Double,
        longitude: Double,
        accuracy: Float,
        placeName: String?,
        workerName: String?,
        workId: String?,
        description: String?,
        dateFormatted: String,
        timeFormatted: String
    ): Bitmap {
        val mutableBitmap = sourceBitmap.copy(Bitmap.Config.ARGB_8888, true)
        val canvas = Canvas(mutableBitmap)

        val width = canvas.width.toFloat()
        val height = canvas.height.toFloat()

        val scale = if (width / 1280f > 0.7f) width / 1280f else 0.75f
        val hasPlace = !placeName.isNull_or_empty() && placeName != "Locating..."
        val hasWorker = !workerName.isNull_or_empty() || !workId.isNull_or_empty()
        val hasDesc = !description.isNull_or_empty()

        // Calculate dynamic height based on lines of text
        var linesCount = 2 // Coordinates + Timestamp
        if (hasPlace) linesCount++
        if (hasWorker) linesCount++
        if (hasDesc) linesCount++

        val boxWidth = (if (hasPlace || hasWorker || hasDesc) 560f else 450f) * scale
        val boxHeight = (linesCount * 30f + 25f) * scale
        val boxX = 28f * scale
        val boxY = height - boxHeight - 28f * scale
        val radius = 14f * scale

        // 1. Dark translucent background plate
        val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.argb(215, 12, 14, 20) // Deep slate background
            style = Paint.Style.FILL
        }
        val bgRect = RectF(boxX, boxY, boxX + boxWidth, boxY + boxHeight)
        canvas.drawRoundRect(bgRect, radius, radius, bgPaint)

        // Border around badge
        val borderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.argb(90, 52, 211, 153) // Emerald border
            style = Paint.Style.STROKE
            strokeWidth = 2f * scale
        }
        canvas.drawRoundRect(bgRect, radius, radius, borderPaint)

        val textX = boxX + 18f * scale
        var curY = boxY + 28f * scale

        // 2. Worker Name & Work ID Line (Gold / Amber)
        if (hasWorker) {
            val workerPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = Color.parseColor("#FBBF24") // Amber / Gold
                textSize = 14f * scale
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            }
            val wName = if (!workerName.isNull_or_empty()) workerName else "N/A"
            val wId = if (!workId.isNull_or_empty()) workId else "N/A"
            canvas.drawText("👤 $wName   🆔 $wId", textX, curY, workerPaint)
            curY += 28f * scale
        }

        // 3. Description Line (Sky Blue / Slate)
        if (hasDesc && description != null) {
            val descPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = Color.parseColor("#38BDF8") // Sky blue
                textSize = 13f * scale
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            }
            val truncatedDesc = if (description.length > 40) description.substring(0, 38) + "..." else description
            canvas.drawText("📝 $truncatedDesc", textX, curY, descPaint)
            curY += 28f * scale
        }

        // 4. Place Name Line (Emerald green)
        if (hasPlace && placeName != null) {
            val placePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = Color.parseColor("#34D399") // Emerald
                textSize = 14f * scale
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            }
            val truncatedPlace = if (placeName.length > 36) placeName.substring(0, 34) + "..." else placeName
            canvas.drawText("📍 $truncatedPlace", textX, curY, placePaint)
            curY += 28f * scale
        }

        // 5. Coordinates & Accuracy
        val coordPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            textSize = 14f * scale
            typeface = Typeface.create(Typeface.MONOSPACE, Typeface.BOLD)
        }
        val coordText = String.format(java.util.Locale.US, "🌐 %.6f, %.6f", latitude, longitude)
        canvas.drawText(coordText, textX, curY, coordPaint)

        val accuracyPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#A1A1AA") // Zinc 400
            textSize = 12f * scale
            typeface = Typeface.DEFAULT
        }
        val accText = String.format(java.util.Locale.US, "Acc: ±%.0fm", accuracy)
        canvas.drawText(accText, textX + 270f * scale, curY, accuracyPaint)

        curY += 28f * scale

        // 6. Date & Time Timestamp
        val timePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#E4E4E7") // Light zinc
            textSize = 12f * scale
            typeface = Typeface.MONOSPACE
        }
        val timeText = "📅 $dateFormatted   🕐 $timeFormatted   🏛️ Marga-eyes"
        canvas.drawText(timeText, textX, curY, timePaint)

        return mutableBitmap
    }

    private fun String?.isNull_or_empty(): Boolean {
        return this == null || this.trim().isEmpty()
    }
}
