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
      text: '<strong>Peter Boylston Adams</strong> is the original nepotism baby of the Revolutionary era. Unlike his older brother John Adams, he wasn’t a statesman or a thinker. He was a local militia officer who stayed in Braintree, MA, ran a farm, made shoes, and lived a simple life away from the spotlight. '
    },
    {
      img: 'https://ids.si.edu/ids/iiif/NPG-NPG_2001_13_ext/full/800,/0/default.jpg',
      title: 'Spike of 1796',
      text: "1796 was the year America sat for its portrait. Upon painter <strong>Gilbert Stuart</strong>'s arrival in Philly, suddenly every Revolutionary hero wanted their face on a canvas. His <strong>George Washington (Lansdowne Portrait)</strong> quickly became the reference image, getting practically Xeroxed across the new republic."
    },
    {
      img: [
        'https://ids.si.edu/ids/iiif/SAAM-1983.95.55_1/full/600,/0/default.jpg',
        'https://ids.si.edu/ids/iiif/SAAM-1983.95.56_1/full/600,/0/default.jpg',
        'https://ids.si.edu/ids/iiif/SAAM-1983.95.57_1/full/600,/0/default.jpg'
      ],
      title: 'Blackout',
      text: "Most early American portraits were painted by white, European-trained men hired by the elite. <strong>Joshua Johnson</strong> didn’t fit any of that. He was a formerly enslaved, self-trained Black painter working in Baltimore. He built a business painting the people just outside the center of power: merchants, sea captains, immigrant families."
    },
    {
      img: 'https://ids.si.edu/ids/iiif/NPG-NPG_96_28Smithson1L-000001/full/800,/0/default.jpg',
      title: 'America’s Accidental Benefactor',
      text: "<strong>James Smithson</strong> never set foot in the US, never worked with the government, and never explained what he wanted. Yet his will left his entire fortune to a country he didn’t visit, with a single line instructing America to create an institution \"for the increase and diffusion of knowledge.\"<br><br>Congress spent years fighting over what he even meant before finally inventing the Smithsonian out of shame, confusion, and free money. Every museum, archive, and research wing that now carries his name exists because a British chemist with no heirs dropped an intellectual time bomb into Washington and walked away."
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
    if (Array.isArray(slide.img)) {
      const pick = slide.img[Math.floor(Math.random() * slide.img.length)];
      if (imgEl) imgEl.style.backgroundImage = `url('${pick}')`;
    } else {
      if (imgEl) imgEl.style.backgroundImage = `url('${slide.img}')`;
    }
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
