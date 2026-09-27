// src-tauri/src/server.rs
use std::process::{Command, Stdio};
use std::sync::Arc;
use crate::media::MediaStreamState;

pub fn start_streaming_server(media_state_clone: Arc<MediaStreamState>) {
    std::thread::spawn(move || {
        let server = tiny_http::Server::http("127.0.0.1:39393").unwrap();
        println!("🚀 [HTTP STREAM SERVER] Running on http://127.0.0.1:39393/stream");

        for request in server.incoming_requests() {
            let state = media_state_clone.clone();

            // 🔥 THE MASTER FIX: Har stream request ke liye ek alag THREAD.
            // Ab seek/track change karte waqt server atakega nahi!
            std::thread::spawn(move || {
                let video_path = { state.current_path.lock().unwrap().clone() };
                let audio_idx = { *state.audio_index.lock().unwrap() };

                if video_path.is_empty() {
                    let _ = request.respond(tiny_http::Response::from_string("No media loaded").with_status_code(404));
                    return;
                }

                let url = request.url();
                let mut start_time = "0".to_string();
                if let Some(pos) = url.find("start=") {
                    let rest = &url[pos + 6..];
                    let end = rest.find('&').unwrap_or(rest.len());
                    start_time = rest[..end].to_string();
                }

                println!("📺 [STREAMING THREAD] Audio: 0:{}, Start: {}s", audio_idx, start_time);

                let mut ffmpeg_child = match Command::new("ffmpeg")
                    .args([
                        "-ss", &start_time,             
                        "-i", &video_path,
                        "-map", "0:0",                  
                        "-map", &format!("0:{}", audio_idx), 
                        "-c:v", "copy",                 
                        "-c:a", "aac",                  
                        "-f", "mp4",                    
                        "-movflags", "frag_keyframe+empty_moov",
                        "pipe:1"
                    ])
                    .stdout(Stdio::piped())
                    .stderr(Stdio::null())
                    .spawn() {
                        Ok(child) => child,
                        Err(_) => return,
                    };

                let stdout = ffmpeg_child.stdout.take().unwrap();
                let response = tiny_http::Response::new(
                    tiny_http::StatusCode(200),
                    vec![
                        tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"video/mp4"[..]).unwrap(),
                        tiny_http::Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap(),
                    ],
                    stdout, None, None,
                );

                // Jaise hi browser stream cancel karega (seek pe), yeh break ho jayega.
                let _ = request.respond(response);
                
                // 🔥 Cleanup: Purane FFmpeg process ko maar do taaki RAM bache
                let _ = ffmpeg_child.kill();
                println!("🛑 [STREAM KILLED] Old stream closed for {}", start_time);
            });
        }
    });
}