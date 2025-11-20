# Suno API Quick Start

> Get started with Suno API in minutes to generate high-quality AI music, lyrics, and audio processing

## Welcome to Suno API

Suno API is powered by advanced AI models to provide comprehensive music generation and audio processing services. Whether you need music creation, lyrics generation, audio editing, or vocal separation, our API meets all your creative needs.

<CardGroup cols={2}>
  <Card title="Music Generation" icon="music" href="/suno-api/generate-music">
    Generate high-quality music from text descriptions
  </Card>

  <Card title="Lyrics Creation" icon="pen-to-square" href="/suno-api/generate-lyrics">
    Create AI-powered lyrics for your songs
  </Card>

  <Card title="Audio Processing" icon="waveform-lines" href="/suno-api/separate-vocals-from-music">
    Extend, convert, and separate audio tracks
  </Card>

  <Card title="Music Videos" icon="video" href="/suno-api/create-music-video">
    Generate visual music videos from audio
  </Card>
</CardGroup>

## Authentication

All API requests require authentication using a Bearer token. Please obtain your API key from the [API Key Management page](https://sunoapi.org/api-key).

<Warning>
  Keep your API key secure and never share it publicly. If you suspect your key has been compromised, reset it immediately.
</Warning>

### API Base URL

```
https://api.sunoapi.org
```

### Authentication Header

```http  theme={null}
Authorization: Bearer YOUR_API_KEY
```

## Quick Start Guide

### Step 1: Generate Your First Song

Start with a simple music generation request:

<CodeGroup>
  ```bash cURL theme={null}
  curl -X POST "https://api.sunoapi.org/api/v1/generate" \
    -H "Authorization: Bearer YOUR_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "prompt": "A peaceful acoustic guitar melody with soft vocals, folk style",
      "customMode": false,
      "instrumental": false,
      "model": "V3_5",
      "callBackUrl": "https://your-server.com/callback"
    }'
  ```

  ```javascript JavaScript theme={null}
  const response = await fetch('https://api.sunoapi.org/api/v1/generate', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: 'A peaceful acoustic guitar melody with soft vocals, folk style',
      customMode: false,
      instrumental: false,
      model: 'V3_5',
      callBackUrl: 'https://your-server.com/callback'
    })
  });

  const data = await response.json();
  console.log('Task ID:', data.data.taskId);
  ```

  ```python Python theme={null}
  import requests

  url = "https://api.sunoapi.org/api/v1/generate"
  headers = {
      "Authorization": "Bearer YOUR_API_KEY",
      "Content-Type": "application/json"
  }

  payload = {
      "prompt": "A peaceful acoustic guitar melody with soft vocals, folk style",
      "customMode": False,
      "instrumental": False,
      "model": "V3_5",
      "callBackUrl": "https://your-server.com/callback"
  }

  response = requests.post(url, json=payload, headers=headers)
  result = response.json()

  print(f"Task ID: {result['data']['taskId']}")
  ```

  ```php PHP theme={null}
  <?php
  $url = 'https://api.sunoapi.org/api/v1/generate';
  $headers = [
      'Authorization: Bearer YOUR_API_KEY',
      'Content-Type: application/json'
  ];

  $payload = [
      'prompt' => 'A peaceful acoustic guitar melody with soft vocals, folk style',
      'customMode' => false,
      'instrumental' => false,
      'model' => 'V3_5',
      'callBackUrl' => 'https://your-server.com/callback'
  ];

  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, $url);
  curl_setopt($ch, CURLOPT_POST, true);
  curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
  curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

  $response = curl_exec($ch);
  curl_close($ch);

  $result = json_decode($response, true);
  echo "Task ID: " . $result['data']['taskId'];
  ?>
  ```
</CodeGroup>

### Step 2: Check Task Status

Use the returned task ID to check generation status:

<CodeGroup>
  ```bash cURL theme={null}
  curl -X GET "https://api.sunoapi.org/api/v1/generate/record-info?taskId=YOUR_TASK_ID" \
    -H "Authorization: Bearer YOUR_API_KEY"
  ```

  ```javascript JavaScript theme={null}
  const response = await fetch(`https://api.sunoapi.org/api/v1/generate/record-info?taskId=${taskId}`, {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  });

  const result = await response.json();

  if (result.data.status === 'SUCCESS') {
    console.log('Generation complete!');
    console.log('Audio URLs:', result.data.response.data);
  } else if (result.data.status === 'GENERATING') {
    console.log('Still generating...');
  } else {
    console.log('Generation failed:', result.data.status);
  }
  ```

  ```python Python theme={null}
  import requests
  import time

  def check_task_status(task_id, api_key):
      url = f"https://api.sunoapi.org/api/v1/generate/record-info?taskId={task_id}"
      headers = {"Authorization": f"Bearer {api_key}"}
      
      response = requests.get(url, headers=headers)
      result = response.json()
      
      status = result['data']['status']
      
      if status == 'SUCCESS':
          print("Generation complete!")
          audio_data = result['data']['response']['data']
          for i, audio in enumerate(audio_data):
              print(f"Track {i+1}: {audio['audio_url']}")
          return audio_data
      elif status == 'GENERATING':
          print("Still generating...")
          return None
      else:
          print(f"Generation failed: {status}")
          return None

  # Poll until completion
  task_id = "YOUR_TASK_ID"
  while True:
      audio_data = check_task_status(task_id, "YOUR_API_KEY")
      if audio_data:
          break
      time.sleep(30)  # Wait 30 seconds before checking again
  ```
</CodeGroup>

### Response Format

**Success Response:**

```json  theme={null}
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "suno_task_abc123"
  }
}
```

**Task Status Response:**

```json  theme={null}
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "suno_task_abc123",
    "status": "SUCCESS",
    "response": {
      "data": [
        {
          "id": "audio_123",
          "audio_url": "https://example.com/generated-music.mp3",
          "title": "Generated Song",
          "tags": "folk, acoustic",
          "duration": 180.5
        }
      ]
    }
  }
}
```

## Core Features

### Music Generation

Create complete songs from text descriptions:

```json  theme={null}
{
  "prompt": "An upbeat electronic dance track with synth leads",
  "customMode": true,
  "style": "Electronic Dance",
  "title": "Digital Dreams",
  "instrumental": false,
  "model": "V4_5"
}
```

### Lyrics Creation

Generate AI-powered lyrics independently:

```json  theme={null}
{
  "prompt": "A song about overcoming challenges and finding inner strength",
  "callBackUrl": "https://your-server.com/lyrics-callback"
}
```

### Audio Extension

Extend existing music tracks:

```json  theme={null}
{
  "audioId": "e231****-****-****-****-****8cadc7dc",
  "defaultParamFlag": true,
  "prompt": "Continue with a guitar solo",
  "continueAt": 120,
  "model": "V3_5"
}
```

### Upload and Cover

Transform existing audio with new styles:

```json  theme={null}
{
  "uploadUrl": "https://example.com/original-audio.mp3",
  "customMode": true,
  "style": "Jazz",
  "title": "Jazz Version",
  "prompt": "Transform into smooth jazz style"
}
```

## Model Versions

Choose the right model for your needs:

<CardGroup cols={3}>
  <Card title="V3_5" icon="music">
    **Balanced**

    Solid arrangements with creative diversity, up to 4 minutes
  </Card>

  <Card title="V4" icon="waveform-lines">
    **High Quality**

    Best audio quality with refined song structure, up to 4 minutes
  </Card>

  <Card title="V4_5" icon="sparkles">
    **Advanced**

    Superior genre blending with smarter prompts, up to 8 minutes
  </Card>

  <Card title="V4_5PLUS" icon="star">
    **Richer Sound**

    Enhanced musicality with new creative ways, up to 8 minutes
  </Card>

  <Card title="V5" icon="bolt">
    **Faster Generation**

    Superior musicality with improved speed, up to 8 minutes
  </Card>
</CardGroup>

## Key Parameters

<ParamField path="prompt" type="string">
  Text description for music generation. Provide detailed, specific descriptions for better results.

  **Prompt Tips:**

  * Describe musical style and genre
  * Include mood and atmosphere
  * Specify instruments and vocals
  * Add tempo and energy descriptions
</ParamField>

<ParamField path="model" type="string" required>
  Model version to use:

  * `V3_5` - Creative diversity, up to 4 minutes
  * `V4` - Best audio quality, up to 4 minutes
  * `V4_5` - Advanced features, up to 8 minutes
  * `V4_5PLUS` - Richer sound, up to 8 minutes
  * `V5` - Faster generation with superior musicality, up to 8 minutes
</ParamField>

<ParamField path="customMode" type="boolean">
  Enable custom parameter mode for advanced control. When `true`, requires additional parameters like `style` and `title`.
</ParamField>

<ParamField path="instrumental" type="boolean">
  Generate instrumental-only music without vocals. Default is `false`.
</ParamField>

<ParamField path="style" type="string">
  Music style or genre (required in custom mode). Examples: "Jazz", "Rock", "Classical", "Electronic"
</ParamField>

<ParamField path="title" type="string">
  Song title (required in custom mode). Maximum 80 characters.
</ParamField>

<ParamField path="callBackUrl" type="string">
  URL to receive completion notifications. See callback documentation for details.
</ParamField>

## Complete Workflow Example

Here's a complete music generation and processing example:

<Tabs>
  <Tab title="JavaScript">
    ```javascript  theme={null}
    class SunoAPI {
      constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.sunoapi.org/api/v1';
      }
      
      async generateMusic(options) {
        const response = await fetch(`${this.baseUrl}/generate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(options)
        });
        
        const result = await response.json();
        if (result.code !== 200) {
          throw new Error(`Generation failed: ${result.msg}`);
        }
        
        return result.data.taskId;
      }
      
      async generateLyrics(prompt) {
        const response = await fetch(`${this.baseUrl}/lyrics`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt,
            callBackUrl: 'https://your-server.com/lyrics-callback'
          })
        });
        
        const result = await response.json();
        return result.data.taskId;
      }
      
      async waitForCompletion(taskId, maxWaitTime = 600000) { // 10 minutes max
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
          const status = await this.getTaskStatus(taskId);
          
          if (status.status === 'SUCCESS') {
            return status.response;
          } else if (status.status === 'FAILED') {
            throw new Error(`Generation failed: ${status.errorMessage}`);
          }
          
          // Wait 30 seconds before checking again
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
        
        throw new Error('Generation timeout');
      }
      
      async getTaskStatus(taskId) {
        const response = await fetch(`${this.baseUrl}/generate/record-info?taskId=${taskId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });
        
        const result = await response.json();
        return result.data;
      }
      
      async extendMusic(audioId, options) {
        const response = await fetch(`${this.baseUrl}/generate/extend`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            audioId,
            ...options
          })
        });
        
        const result = await response.json();
        return result.data.taskId;
      }
      
      async separateVocals(taskId, audioId) {
        const response = await fetch(`${this.baseUrl}/vocal-removal/generate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            taskId,
            audioId,
            callBackUrl: 'https://your-server.com/vocal-callback'
          })
        });
        
        const result = await response.json();
        return result.data.taskId;
      }
      
      async getRemainingCredits() {
        const response = await fetch(`${this.baseUrl}/get-credits`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });
        
        const result = await response.json();
        return result.data.credits;
      }
    }

    // Usage example
    async function main() {
      const api = new SunoAPI('YOUR_API_KEY');
      
      try {
        // Check remaining credits
        const credits = await api.getRemainingCredits();
        console.log(`Remaining credits: ${credits}`);
        
        // Generate lyrics first
        console.log('Generating lyrics...');
        const lyricsTaskId = await api.generateLyrics(
          'A song about adventure and discovery, uplifting and inspiring'
        );
        
        const lyricsResult = await api.waitForCompletion(lyricsTaskId);
        console.log('Lyrics generated:', lyricsResult.data[0].text);
        
        // Generate music with custom parameters
        console.log('Generating music...');
        const musicTaskId = await api.generateMusic({
          prompt: lyricsResult.data[0].text,
          customMode: true,
          style: 'Folk Pop',
          title: 'Adventure Song',
          instrumental: false,
          model: 'V4_5',
          callBackUrl: 'https://your-server.com/music-callback'
        });
        
        // Wait for completion
        const musicResult = await api.waitForCompletion(musicTaskId);
        console.log('Music generated successfully!');
        
        musicResult.data.forEach((track, index) => {
          console.log(`Track ${index + 1}:`);
          console.log(`  Title: ${track.title}`);
          console.log(`  Duration: ${track.duration}s`);
          console.log(`  Audio URL: ${track.audio_url}`);
        });
        
        // Extend the first track
        const originalTrack = musicResult.data[0];
        console.log('Extending music...');
        const extendTaskId = await api.extendMusic(originalTrack.id, {
          defaultParamFlag: true,
          prompt: 'Continue with a beautiful instrumental outro',
          continueAt: originalTrack.duration - 30, // Extend from 30s before end
          model: 'V4_5'
        });
        
        const extendedResult = await api.waitForCompletion(extendTaskId);
        console.log('Extended version created:', extendedResult.data[0].audio_url);
        
        // Separate vocals
        console.log('Separating vocals...');
        const separationTaskId = await api.separateVocals(musicTaskId, originalTrack.id);
        const separationResult = await api.waitForCompletion(separationTaskId);
        
        console.log('Vocal separation completed:');
        console.log(`  Instrumental: ${separationResult.vocal_removal_info.instrumental_url}`);
        console.log(`  Vocals only: ${separationResult.vocal_removal_info.vocal_url}`);
        
      } catch (error) {
        console.error('Error:', error.message);
      }
    }

    main();
    ```
  </Tab>

  <Tab title="Python">
    ```python  theme={null}
    import requests
    import time

    class SunoAPI:
        def __init__(self, api_key):
            self.api_key = api_key
            self.base_url = 'https://api.sunoapi.org/api/v1'
            self.headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
        
        def generate_music(self, **options):
            response = requests.post(f'{self.base_url}/generate', 
                                   headers=self.headers, json=options)
            result = response.json()
            
            if result['code'] != 200:
                raise Exception(f"Generation failed: {result['msg']}")
            
            return result['data']['taskId']
        
        def generate_lyrics(self, prompt):
            response = requests.post(f'{self.base_url}/lyrics',
                                   headers=self.headers,
                                   json={
                                       'prompt': prompt,
                                       'callBackUrl': 'https://your-server.com/lyrics-callback'
                                   })
            result = response.json()
            return result['data']['taskId']
        
        def wait_for_completion(self, task_id, max_wait_time=600):
            start_time = time.time()
            
            while time.time() - start_time < max_wait_time:
                status = self.get_task_status(task_id)
                
                if status['status'] == 'SUCCESS':
                    return status['response']
                elif status['status'] == 'FAILED':
                    raise Exception(f"Generation failed: {status.get('errorMessage')}")
                
                time.sleep(30)  # Wait 30 seconds
            
            raise Exception('Generation timeout')
        
        def get_task_status(self, task_id):
            response = requests.get(f'{self.base_url}/generate/record-info?taskId={task_id}',
                                  headers={'Authorization': f'Bearer {self.api_key}'})
            return response.json()['data']
        
        def extend_music(self, audio_id, **options):
            response = requests.post(f'{self.base_url}/generate/extend',
                                   headers=self.headers,
                                   json={'audioId': audio_id, **options})
            return response.json()['data']['taskId']
        
        def separate_vocals(self, task_id, audio_id):
            response = requests.post(f'{self.base_url}/vocal-removal/generate',
                                   headers=self.headers,
                                   json={
                                       'taskId': task_id,
                                       'audioId': audio_id,
                                       'callBackUrl': 'https://your-server.com/vocal-callback'
                                   })
            return response.json()['data']['taskId']
        
        def get_remaining_credits(self):
            response = requests.get(f'{self.base_url}/get-credits',
                                  headers={'Authorization': f'Bearer {self.api_key}'})
            return response.json()['data']['credits']

    # Usage example
    def main():
        api = SunoAPI('YOUR_API_KEY')
        
        try:
            # Check remaining credits
            credits = api.get_remaining_credits()
            print(f'Remaining credits: {credits}')
            
            # Generate lyrics first
            print('Generating lyrics...')
            lyrics_task_id = api.generate_lyrics(
                'A song about adventure and discovery, uplifting and inspiring'
            )
            
            lyrics_result = api.wait_for_completion(lyrics_task_id)
            print('Lyrics generated:', lyrics_result['data'][0]['text'])
            
            # Generate music with custom parameters
            print('Generating music...')
            music_task_id = api.generate_music(
                prompt=lyrics_result['data'][0]['text'],
                customMode=True,
                style='Folk Pop',
                title='Adventure Song',
                instrumental=False,
                model='V4_5',
                callBackUrl='https://your-server.com/music-callback'
            )
            
            # Wait for completion
            music_result = api.wait_for_completion(music_task_id)
            print('Music generated successfully!')
            
            for i, track in enumerate(music_result['data']):
                print(f'Track {i + 1}:')
                print(f'  Title: {track["title"]}')
                print(f'  Duration: {track["duration"]}s')
                print(f'  Audio URL: {track["audio_url"]}')
            
            # Extend the first track
            original_track = music_result['data'][0]
            print('Extending music...')
            extend_task_id = api.extend_music(
                original_track['id'],
                defaultParamFlag=True,
                prompt='Continue with a beautiful instrumental outro',
                continueAt=original_track['duration'] - 30,
                model='V4_5'
            )
            
            extended_result = api.wait_for_completion(extend_task_id)
            print('Extended version created:', extended_result['data'][0]['audio_url'])
            
            # Separate vocals
            print('Separating vocals...')
            separation_task_id = api.separate_vocals(music_task_id, original_track['id'])
            separation_result = api.wait_for_completion(separation_task_id)
            
            print('Vocal separation completed:')
            vocal_info = separation_result['vocal_removal_info']
            print(f'  Instrumental: {vocal_info["instrumental_url"]}')
            print(f'  Vocals only: {vocal_info["vocal_url"]}')
            
        except Exception as error:
            print(f'Error: {error}')

    if __name__ == '__main__':
        main()
    ```
  </Tab>
</Tabs>

## Advanced Features

### Upload and Extend

Upload your own audio and extend it with AI:

```javascript  theme={null}
const extendTaskId = await api.generateMusic({
  uploadUrl: 'https://example.com/my-song.mp3',
  defaultParamFlag: true,
  prompt: 'Add a rock guitar solo section',
  continueAt: 60,
  model: 'V4_5'
});
```

### Audio Format Conversion

Convert music to high-quality WAV format:

```javascript  theme={null}
const wavTaskId = await api.convertToWav({
  taskId: 'original_task_id',
  audioId: 'e231****-****-****-****-****8cadc7dc',
  callBackUrl: 'https://your-server.com/wav-callback'
});
```

### Music Video Generation

Create visual music videos:

```javascript  theme={null}
const videoTaskId = await api.createMusicVideo({
  taskId: 'music_task_id',
  audioId: 'e231****-****-****-****-****8cadc7dc',
  author: 'Artist Name',
  domainName: 'your-brand.com',
  callBackUrl: 'https://your-server.com/video-callback'
});
```

### Using Callbacks

Set up webhook callbacks for automatic notifications:

```javascript  theme={null}
// Your callback endpoint
app.post('/music-callback', (req, res) => {
  const { code, data } = req.body;
  
  if (code === 200) {
    console.log('Music ready:', data.data);
    data.data.forEach(track => {
      console.log(`Title: ${track.title}`);
      console.log(`Audio: ${track.audio_url}`);
    });
  } else {
    console.log('Generation failed:', req.body.msg);
  }
  
  res.status(200).json({ status: 'received' });
});
```

<Card title="Learn More About Callbacks" icon="webhook" href="/suno-api/generate-music-callbacks">
  Set up webhook callbacks to receive automatic notifications when your music is ready.
</Card>

## Task Status Explanation

<ResponseField name="GENERATING" type="Processing">
  Task is being processed
</ResponseField>

<ResponseField name="SUCCESS" type="Completed">
  Task completed successfully
</ResponseField>

<ResponseField name="FAILED" type="Failed">
  Task failed to complete
</ResponseField>

<ResponseField name="PENDING" type="Queued">
  Task is queued for processing
</ResponseField>

## Best Practices

<AccordionGroup>
  <Accordion title="Prompt Optimization">
    * Use detailed, specific descriptions for music style and mood
    * Include instrument specifications and vocal requirements
    * Specify tempo, energy level, and song structure
    * Avoid conflicting or overly complex descriptions
  </Accordion>

  <Accordion title="Model Selection">
    * Use V3\_5 for creative and experimental music
    * Choose V4 for highest audio quality in standard lengths
    * Select V4\_5 for advanced features and longer tracks
    * V4\_5PLUS offers richer sound with new creative ways
    * V5 provides faster generation with superior musicality
    * Consider your specific use case and quality requirements
  </Accordion>

  <Accordion title="Performance Optimization">
    * Use callbacks instead of frequent polling
    * Implement proper retry logic for failed requests
    * Monitor your credit usage and plan accordingly
    * Cache results to avoid regenerating similar content
  </Accordion>

  <Accordion title="Error Handling">
    * Implement appropriate retry logic for transient failures
    * Monitor task status and handle timeout scenarios
    * Validate input parameters before making requests
    * Log errors for debugging and monitoring
  </Accordion>
</AccordionGroup>

## File Storage and Access

<Warning>
  Generated audio files are stored for **15 days** before automatic deletion. Download URLs may have limited validity periods.
</Warning>

* Audio files remain accessible for 15 days after generation
* Download and save important files to your own storage
* Use the API to regenerate content if needed after expiration
* Consider implementing local backup strategies for critical content

## Next Steps

<CardGroup cols={2}>
  <Card title="Generate Music" icon="music" href="/suno-api/generate-music">
    Complete API reference for music generation
  </Card>

  <Card title="Create Lyrics" icon="pen-to-square" href="/suno-api/generate-lyrics">
    AI-powered lyrics generation
  </Card>

  <Card title="Audio Processing" icon="waveform-lines" href="/suno-api/separate-vocals-from-music">
    Extend, convert, and separate audio
  </Card>

  <Card title="Callback Setup" icon="webhook" href="/suno-api/generate-music-callbacks">
    Set up automatic notifications
  </Card>
</CardGroup>

## Support

<Info>
  Need help? Our technical support team is here to assist you.

  * **Email**: [support@sunoapi.org](mailto:support@sunoapi.org)
  * **Documentation**: [docs.sunoapi.org](https://docs.sunoapi.org)
  * **API Status**: Check our status page for real-time API health
</Info>

***

Ready to start creating amazing AI music? [Get your API key](https://sunoapi.org/api-key) and begin composing today!
