// ============ ZONE CARD INTERACTIONS ============
document.addEventListener('DOMContentLoaded', () => {
  const zoneData = {
    1: {
      title: '🔍 Khu Khám Phá — Quan sát & Tìm hiểu',
      desc: 'Nơi học sinh bắt đầu hành trình khoa học bằng việc quan sát thế giới tự nhiên qua kính hiển vi, mô hình giải phẫu, tiêu bản sinh học và các mẫu vật thật.',
      items: ['Kính hiển vi quang học & kỹ thuật số', 'Mô hình giải phẫu 3D', 'Tiêu bản thực vật & động vật', 'Góc trưng bày sinh vật sống (terrarium, bể cá)', 'Vườn mini trong nhà']
    },
    2: {
      title: '🧪 Khu Thí Nghiệm — Thực hành & Thử nghiệm',
      desc: 'Không gian thực hành với bàn thí nghiệm linh hoạt, dụng cụ và hóa chất an toàn, phục vụ các thí nghiệm sinh học đa dạng.',
      items: ['Bàn thí nghiệm linh hoạt, đa năng', 'Dụng cụ & hóa chất an toàn', 'Thí nghiệm vi sinh vật', 'Thí nghiệm enzyme & protein', 'Thí nghiệm quang hợp & hô hấp', 'Thí nghiệm di truyền học']
    },
    3: {
      title: '🧬 Khu Công Nghệ Sinh Học — Công nghệ & Ứng dụng',
      desc: 'Ứng dụng công nghệ sinh học hiện đại vào giảng dạy, giúp học sinh tiếp cận các kỹ thuật tiên tiến.',
      items: ['Máy PCR (mô phỏng)', 'Gel điện di (mô phỏng)', 'Nuôi cấy mô thực vật', 'Vi sinh ứng dụng', 'Công nghệ sinh học trong đời sống']
    },
    4: {
      title: '💡 Khu Dự Án & Sáng Tạo — Thiết kế, Chế tạo, Trình bày',
      desc: 'Không gian sáng tạo để học sinh làm việc nhóm, thiết kế và trình bày các dự án khoa học.',
      items: ['Không gian làm việc nhóm', 'Thiết kế poster khoa học', 'Chế tạo mô hình sinh học', 'Tạo sản phẩm sinh học', 'Trình bày & phản biện khoa học']
    },
    5: {
      title: '🌳 Khu Xanh & Học Ngoài Trời — Kết nối thiên nhiên',
      desc: 'Học tập ngoài trời, kết nối trực tiếp với thiên nhiên qua vườn thực vật và hệ sinh thái mini.',
      items: ['Vườn thực vật đa dạng', 'Hệ sinh thái mini', 'Quan sát côn trùng & chim', 'Nghiên cứu đất & nước', 'Thu thập dữ liệu thực địa']
    },
    6: {
      title: '📚 Khu Lưu Trữ & Học Liệu — Tài nguyên & Chia sẻ',
      desc: 'Kho tàng tài nguyên học tập phong phú, từ mẫu vật thật đến tài liệu số.',
      items: ['Tủ mẫu vật & tiêu bản', 'Thư viện sách sinh học', 'Video & phim tài liệu', 'Phần mềm mô phỏng', 'Kho học liệu số & cơ liệu thí nghiệm']
    }
  };

  const modal = document.getElementById('zoneModal');
  const modalClose = document.getElementById('modalClose');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalList = document.getElementById('modalList');

  // Click zone card to open modal
  document.querySelectorAll('.zone-card').forEach(card => {
    card.addEventListener('click', () => {
      const zone = card.dataset.zone;
      const data = zoneData[zone];
      if (data && modal) {
        modalTitle.textContent = data.title;
        modalDesc.textContent = data.desc;
        modalList.innerHTML = data.items.map(item => `<li>${item}</li>`).join('');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  // Close modal
  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  function closeModal() {
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
});
