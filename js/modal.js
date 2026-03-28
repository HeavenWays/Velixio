    function openStartModal(planName) {
      var modal = document.getElementById('start-modal');
      if (!modal) return;
      var sub = modal.querySelector('.modal-sub');
      if (sub) {
        sub.innerHTML = planName
          ? 'Plan choisi\u00a0: <strong style="color:#E8BF45">' + planName + '</strong><br>Comment voulez-vous nous contacter\u00a0?'
          : 'Choisissez la m\u00e9thode qui vous convient.<br>On vous r\u00e9pond <strong>sous 2h</strong> \u2014 c\'est notre engagement.';
      }
      var waCard = modal.querySelector('.modal-card.whatsapp');
      if (waCard) {
        var msg = planName
          ? 'Bonjour Velixio, je suis int\u00e9ress\u00e9(e) par le plan ' + planName + '. Pouvez-vous me contacter ?'
          : 'Bonjour Velixio, je souhaite d\u00e9marrer un projet web. Pouvez-vous me contacter ?';
        waCard.href = 'https://wa.me/212674323871?text=' + encodeURIComponent(msg);
      }
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeStartModal() {
      var modal = document.getElementById('start-modal');
      if (!modal) return;
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeStartModal();
    });
