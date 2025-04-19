
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
      const caption = document.getElementById('caption');
      const captionIf = caption ? caption.value : '';

      const formData = new FormData();
      formData.append('file', capturedBlob, 'picture.png');
      formData.append('caption', captionIf);
      const isProfile = document.querySelector('input[name="isProfile"]').value;
      formData.append('isProfile', isProfile);
    
      try {
        const res = await fetch('/take_picture/take_picture', {
            method: 'POST',
            body: formData
          });
          
    
        const result = await res.json();
    
        if (res.ok) {
          const isProfileInput = document.querySelector('input[name="isProfile"]');
          const isProfile = isProfileInput ? isProfileInput.value === 'true' : false;
          const successMessage = document.getElementById('successMessage');
          successMessage.style.display = 'block';
        
          // ✅ Redirect based on isProfile value
          setTimeout(() => {
            if (isProfile) {
              window.location.href = '/profile'; // go to user profile page
            } else {
              window.location.href = '/home';    // go to home feed or dashboard
            }
          }, 2000);

        } else {
          throw new Error(result.message || 'Upload failed');
        }
      } catch (err) {
        console.error('Upload error:', err);
        alert('Upload failed from hbs.js');
      }
    });
});


