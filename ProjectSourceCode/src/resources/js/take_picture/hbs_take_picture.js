document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const snap = document.getElementById('snap');
  const retake = document.getElementById('retake');
  const uploadBtn = document.getElementById('uploadBtn');
  const ctx = canvas.getContext('2d');
  const flipCameraBtn = document.getElementById('flipCameraBtn');

  let stream = null;
  let capturedBlob = null;
  let currentCamera = 'user';
  let frontCameraId = null;
  let backCameraId = null;

  function startCamera(deviceId = null) {
    const constraints = {
      video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' }
    };

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }

    navigator.mediaDevices.getUserMedia(constraints)
      .then(s => {
        stream = s;
        video.srcObject = stream;
      })
      .catch(err => {
        console.error('Camera error:', err);
        alert('Could not access selected camera.');
      });
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
  }

  if (flipCameraBtn) {
    flipCameraBtn.style.display = 'none';

    const isProbablyMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isProbablyMobile) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
          s.getTracks().forEach(track => track.stop());
          return navigator.mediaDevices.enumerateDevices();
        })
        .then(devices => {
          const videoInputs = devices.filter(d => d.kind === 'videoinput');

          if (videoInputs.length > 1) {
            frontCameraId = videoInputs[0].deviceId;
            backCameraId = videoInputs[1].deviceId;
            flipCameraBtn.style.display = 'inline-block';
          }

          // Start with front camera by default
          startCamera(frontCameraId || videoInputs[0].deviceId);
        })
        .catch(err => {
          console.error('Device error:', err);
        });

      flipCameraBtn.addEventListener('click', () => {
        if (!frontCameraId || !backCameraId) return;

        currentCamera = currentCamera === 'user' ? 'environment' : 'user';
        const selectedId = currentCamera === 'user' ? frontCameraId : backCameraId;
        startCamera(selectedId);
      });
    } else {
      startCamera(); // fallback for desktops
    }
  } else {
    startCamera(); // fallback if no flip button
  }

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

    if (flipCameraBtn) {
      flipCameraBtn.style.display = 'none';
    }
  });

  retake.addEventListener('click', () => {
    const selectedId = currentCamera === 'user' ? frontCameraId : backCameraId;
    startCamera(selectedId);

    canvas.style.display = 'none';
    video.style.display = 'block';
    snap.style.display = 'inline-block';
    retake.style.display = 'none';
    uploadBtn.style.display = 'none';
    capturedBlob = null;

    if (flipCameraBtn && frontCameraId && backCameraId) {
      flipCameraBtn.style.display = 'inline-block';
    }
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

        setTimeout(() => {
          window.location.href = isProfile ? '/profile' : '/home';
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
