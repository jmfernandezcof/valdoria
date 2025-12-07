(function() {
  function update() {
    var n = new Date();
    var t = n.toLocaleTimeString('es-ES', {timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false});
    var d = n.toLocaleDateString('es-ES', {timeZone: 'Europe/Madrid', weekday: 'short', day: 'numeric', month: 'short'});
    var te = document.getElementById('clock-time');
    var de = document.getElementById('clock-date');
    if (te) te.textContent = t;
    if (de) de.textContent = d.charAt(0).toUpperCase() + d.slice(1);
  }
  function init() {
    var c = document.getElementById('valdoria-clock-widget');
    if (c) c.innerHTML = '<div class="clock-time" id="clock-time">--:--</div><div class="clock-date" id="clock-date">...</div>';
    update();
    setInterval(update, 60000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
