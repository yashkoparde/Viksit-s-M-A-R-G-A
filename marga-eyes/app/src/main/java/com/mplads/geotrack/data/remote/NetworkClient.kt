package com.mplads.geotrack.data.remote

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object NetworkClient {
    // USB Cable connection using ADB reverse port forwarding (tcp:5001 -> tcp:5001)
    var baseUrl: String = "http://127.0.0.1:5001/"
        set(value) {
            field = if (value.endsWith("/")) value else "$value/"
            apiServiceInstance = null
        }

    private var apiServiceInstance: ApiService? = null

    val apiService: ApiService
        get() {
            if (apiServiceInstance == null) {
                val logging = HttpLoggingInterceptor().apply {
                    level = HttpLoggingInterceptor.Level.BODY
                }

                val okHttpClient = OkHttpClient.Builder()
                    .addInterceptor(logging)
                    .connectTimeout(15, TimeUnit.SECONDS)
                    .readTimeout(15, TimeUnit.SECONDS)
                    .writeTimeout(30, TimeUnit.SECONDS)
                    .build()

                val retrofit = Retrofit.Builder()
                    .baseUrl(baseUrl)
                    .client(okHttpClient)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build()

                apiServiceInstance = retrofit.create(ApiService::class.java)
            }
            return apiServiceInstance!!
        }
}
