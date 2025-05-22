'use client'

import { supabase } from './supabase'

export async function uploadFileToSupabase(file: File, bucketName = 'images') {
  try {
    // Ensure the bucket exists
    const { error: bucketError } = await supabase.storage.getBucket(bucketName)
    
    // Create the bucket if it doesn't exist
    if (bucketError) {
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true
      })
      if (createError) throw createError
    }
    
    // Generate a unique file name
    const timestamp = new Date().getTime()
    const fileExt = file.name.split('.').pop()
    const fileName = `${timestamp}-${Math.floor(Math.random() * 10000)}.${fileExt}`
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })
      
    if (error) throw error
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName)
      
    return {
      path: data.path,
      publicUrl: publicUrl
    }
  } catch (error) {
    console.error('Error uploading file to Supabase:', error)
    throw error
  }
}

export async function deleteFileFromSupabase(filePath: string, bucketName = 'images') {
  try {
    // Extract the file name from the path
    const fileName = filePath.split('/').pop() || filePath
    
    // Delete the file
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([fileName])
      
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting file from Supabase:', error)
    throw error
  }
} 