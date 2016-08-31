# twitter-crawler

Run TTData.js first, it will get all the tweets on @tickleapp user timeline, and then download the media, then upload the data onto Pinterest.
If error occurs, during either downloading or uploading, run retry_download and retry_upload respectively. 
Error occurs when it downloads too fast or when it uploads too frequently in a period of time, especially during uploading, try again later.