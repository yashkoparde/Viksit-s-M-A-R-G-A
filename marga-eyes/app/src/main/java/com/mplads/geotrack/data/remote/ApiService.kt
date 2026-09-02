package com.mplads.geotrack.data.remote

import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part
import retrofit2.http.PartMap

data class UploadResponse(
    val success: Boolean,
    val message: String?,
    val photo: Map<String, Any>?
)

data class PhotoListResponse(
    val success: Boolean,
    val count: Int,
    val photos: List<Map<String, Any>>?
)

interface ApiService {
    @Multipart
    @POST("api/photos/upload")
    suspend fun uploadPhoto(
        @Part photo: MultipartBody.Part,
        @PartMap fields: Map<String, @JvmSuppressWildcards RequestBody>
    ): Response<UploadResponse>

    @GET("api/photos")
    suspend fun getPhotos(): Response<PhotoListResponse>
}
