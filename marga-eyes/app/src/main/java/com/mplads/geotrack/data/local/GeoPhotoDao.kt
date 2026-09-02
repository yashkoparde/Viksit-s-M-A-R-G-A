package com.mplads.geotrack.data.local

import androidx.room.*
import com.mplads.geotrack.data.model.GeoPhoto
import kotlinx.coroutines.flow.Flow

@Dao
interface GeoPhotoDao {
    @Query("SELECT * FROM geo_photos ORDER BY capturedAt DESC")
    fun getAllPhotos(): Flow<List<GeoPhoto>>

    @Query("SELECT * FROM geo_photos WHERE id = :id")
    suspend fun getPhotoById(id: String): GeoPhoto?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPhoto(photo: GeoPhoto)

    @Query("DELETE FROM geo_photos WHERE id = :id")
    suspend fun deletePhotoById(id: String)

    @Query("SELECT COUNT(*) FROM geo_photos")
    fun getPhotoCount(): Flow<Int>
}
