function toggleMenu() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  sidebar.classList.toggle('active');
  overlay.classList.toggle('active');
  if (sidebar.classList.contains('active')) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

function closeMenu() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  sidebar.classList.remove('active');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

document.addEventListener('click', function(event) {
  const sidebar = document.getElementById('sidebar');
  const menuBtn = document.querySelector('.menu-btn');
  
  if (sidebar.classList.contains('active') && 
      !sidebar.contains(event.target) && 
      !menuBtn.contains(event.target)) {
    closeMenu();
  }
});

window.addEventListener('resize', function() {
  if (window.innerWidth >= 768) {
    closeMenu();
  }
});
document.addEventListener('DOMContentLoaded', function() {
  const card = document.querySelector('.card');
  
  if (card) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(15px)';
    
    setTimeout(() => {
      card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 100);
  }
});