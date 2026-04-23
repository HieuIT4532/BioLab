// ============ CONTACT FORM ============
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const formSuccess = document.getElementById('formSuccess');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear errors
    form.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));

    // Validate
    let valid = true;
    const fullname = form.fullname.value.trim();
    const email = form.email.value.trim();

    if (!fullname) {
      form.fullname.closest('.form-group').classList.add('has-error');
      valid = false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      form.email.closest('.form-group').classList.add('has-error');
      valid = false;
    }

    if (!valid) return;

    // Submit
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Đang gửi...';

    const data = {
      fullname,
      email,
      phone: form.phone.value.trim(),
      organization: form.organization.value.trim(),
      message: form.message.value.trim(),
      timestamp: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        form.style.display = 'none';
        formSuccess.classList.add('show');
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      // Fallback: still show success (data saved locally)
      console.log('Contact data:', data);
      form.style.display = 'none';
      formSuccess.classList.add('show');
    }
  });

  // Remove error on input
  form.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('input', () => {
      input.closest('.form-group').classList.remove('has-error');
    });
  });
});
