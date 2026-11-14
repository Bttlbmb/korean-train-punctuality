// GitHub Pages serves /404.html for missing addresses in either language.
if(location.pathname.startsWith('/ko/')){
 document.documentElement.lang='ko';
 document.title='페이지를 찾을 수 없습니다 · Korean Train Stats';
 const main=document.querySelector('main');
 main.innerHTML='<div class="empty"><h1>페이지를 찾을 수 없습니다.</h1><p class="muted">주소를 확인하거나 첫 화면에서 열차와 날짜별 기록을 찾아보세요. <a href="/ko/">첫 화면으로 이동</a></p></div>';
 const brand=document.querySelector('.brand');if(brand)brand.href='/ko/';
 const font=document.createElement('link');font.rel='stylesheet';font.href='https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600&display=swap';document.head.append(font);
}
