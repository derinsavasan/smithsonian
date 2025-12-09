(function() {
  const slides = [
    {
      img: 'https://ids.si.edu/ids/iiif/NPG-8600336A_1/full/600,/0/default.jpg',
      title: 'More Than a Woman',
      text: 'There is only one woman in the dataset whose identity is not defined by a man: <strong>Patience Lovell Wright</strong>, who was America’s first notable sculptor. Her portrait is not a wife-label. No husband tag, no daughter-of, no widow-of. She’s the only woman who appears with her full name.'
    },
    {
      img: 'https://ids.si.edu/ids/iiif/SAAM-1999.27.7_1/full/600,/0/default.jpg',
      title: 'The OG Nepo Baby',
      text: '<strong>Peter Boylston Adams</strong> is the original nepotism baby of the Revolutionary era. Unlike his older brother John Adams, he wasn’t a statesman or a thinker. He was a local militia officer who stayed in Braintree (MA), ran a farm, made shoes, and lived a simple life away from the spotlight. '
    },
    {
      img: 'https://ids.si.edu/ids/iiif/NPG-NPG_2001_13_ext/full/800,/0/default.jpg',
      title: 'Spike of 1796',
      text: "1796 was the year America sat for its portrait. Upon painter <strong>Gilbert Stuart</strong>'s arrival in Philly, suddenly every Revolutionary hero wanted their face on a canvas. His <strong>George Washington (Lansdowne Portrait)</strong> quickly became the reference image, getting practically Xeroxed across the new republic."
    },
    {
      img: '4-tooltip.png',
      title: 'Placeholder highlight #4',
      text: 'A quick line or two keeps the carousel lightweight.'
    }
  ];
  
  const frame = document.querySelector('.hm-frame');
  const slideEl = frame ? frame.querySelector('.hm-slide') : null;
  const prevBtn = document.querySelector('.hm-prev');
  const nextBtn = document.querySelector('.hm-next');
  let index = 0;
  
  function render() {
    if (!slideEl) return;
    const slide = slides[index];
    const imgEl = slideEl.querySelector('.hm-image');
    const titleEl = slideEl.querySelector('.hm-title');
    const textEl = slideEl.querySelector('.hm-text');
    if (imgEl) imgEl.style.backgroundImage = `url('${slide.img}')`;
    if (titleEl) titleEl.textContent = slide.title;
    if (textEl) textEl.innerHTML = slide.text;
  }
  
  function next() {
    index = (index + 1) % slides.length;
    render();
  }
  
  function prev() {
    index = (index - 1 + slides.length) % slides.length;
    render();
  }
  
  if (prevBtn) prevBtn.addEventListener('click', prev);
  if (nextBtn) nextBtn.addEventListener('click', next);
  
  render();
})();
