
document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const snap = document.getElementById('snap');
    const retake = document.getElementById('retake');
    const uploadBtn = document.getElementById('uploadBtn');
    const ctx = canvas.getContext('2d');
    let stream = null;
    let capturedBlob = null;
    
    function startCamera() {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
          stream = s;
          video.srcObject = stream;
        })
        .catch(() => alert('Webcam access is required.'));
    }
    
    function stopCamera() {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
    }
    
    startCamera();
    
    snap.addEventListener('click', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
    
      canvas.toBlob((blob) => {
        capturedBlob = blob;
      }, 'image/png');
    
      video.style.display = 'none';
      canvas.style.display = 'block';
      snap.style.display = 'none';
      retake.style.display = 'inline-block';
      uploadBtn.style.display = 'inline-block';
    });
    
    retake.addEventListener('click', () => {
      startCamera();
      canvas.style.display = 'none';
      video.style.display = 'block';
      snap.style.display = 'inline-block';
      retake.style.display = 'none';
      uploadBtn.style.display = 'none';
      capturedBlob = null;
    });
    
    uploadBtn.addEventListener('click', async () => {
        const caption = document.getElementById('caption').value;

      const formData = new FormData();
      formData.append('file', capturedBlob, 'picture.png');
      formData.append('caption', caption);
    
      try {
        const res = await fetch('/take_picture/take_picture', {
            method: 'POST',
            body: formData
          });
          
    
        const result = await res.json();
    
        if (res.ok) {
          alert('Upload successful!');
        } else {
          throw new Error(result.message || 'Upload failed');
        }
      } catch (err) {
        console.error('Upload error:', err);
        alert('Upload failed from hbs.js');
      }
    });
});


