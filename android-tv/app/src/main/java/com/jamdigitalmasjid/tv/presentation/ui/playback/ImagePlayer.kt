package com.jamdigitalmasjid.tv.presentation.ui.playback

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import coil.compose.rememberAsyncImagePainter
import java.io.File

@Composable
fun ImagePlayer(
    imageFile: File,
    modifier: Modifier = Modifier
) {
    Image(
        painter = rememberAsyncImagePainter(model = imageFile),
        contentDescription = "Image Content",
        modifier = modifier.fillMaxSize(),
        contentScale = ContentScale.Crop
    )
}
