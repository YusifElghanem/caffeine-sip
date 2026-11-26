$path = 'D:/Website Demos/css/caffeine-sip/index.html'
$content = [IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

$old = '               <div class="relative rounded-2xl overflow-hidden bg-brand-cream aspect-[16/11] mb-4 border border-brand-border group">
                 <img
                   src="assets/guji-bag-orange.jpg"
                   alt="محصول أثيوبيا قوجي كافيين سيب"
                   class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                 />
                 <div class="absolute bottom-3 right-3 bg-brand-dark/85 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1 rounded-lg">
                   ارتفاع 2100م • مجففة • 250 جم
                 </div>
               </div>'

$new = '               <!-- Hero Media Slider: صورة الكيس -> فيديو التحضير -->
               <div id="hero-media-slider" class="relative rounded-2xl overflow-hidden bg-brand-cream aspect-[16/11] mb-4 border border-brand-border">
                 <!-- Slide 1: صورة الكيس -->
                 <div class="hero-media-slide absolute inset-0 transition-all duration-700 ease-out" style="transform: translateX(0`%); opacity: 1;">
                   <img
                     src="assets/guji-bag-orange.jpg"
                     alt="محصول أثيوبيا قوجي كافيين سيب"
                     class="w-full h-full object-cover"
                   />
                   <div class="absolute bottom-3 right-3 bg-brand-dark/85 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1 rounded-lg">
                     ارتفاع 2100م • مجففة • 250 جم
                   </div>
                 </div>
                 
                 <!-- Slide 2: فيديو التحضير -->
                 <div class="hero-media-slide absolute inset-0 transition-all duration-700 ease-out" style="transform: translateX(100`%); opacity: 0;">
                   <video 
                     class="w-full h-full object-cover" 
                     autoplay muted loop playsinline
                     poster="assets/guji-bag-orange.jpg"
                   >
                     <source src="https://assets.mixkit.co/videos/236/236-720.mp4" type="video/mp4" />
                   </video>
                   <div class="absolute inset-0 bg-gradient-to-t from-[#1c120d]/60 via-transparent to-transparent"></div>
                   <div class="absolute bottom-3 right-3 bg-brand-orange/90 text-white text-[11px] font-bold px-3 py-1 rounded-lg">
                     شاهد تحضير قوجي بالفلتر ▶
                   </div>
                 </div>
               </div>

               <!-- Slider Indicators -->
               <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                 <button type="button" class="hero-slide-dot w-2.5 h-2.5 rounded-full bg-brand-orange transition-all cursor-pointer" data-slide="0" aria-label="الصورة"></button>
                 <button type="button" class="hero-slide-dot w-2.5 h-2.5 rounded-full bg-white/50 hover:bg-white transition-all cursor-pointer" data-slide="1" aria-label="الفيديو"></button>
               </div>'

if ($content.Contains($old)) {
    $content = $content.Replace($old, $new)
    [IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
    Write-Host 'SUCCESS: Hero media slider added'
} else {
    Write-Host 'OLD STRING NOT FOUND - checking exact match...'
    $idx = $content.IndexOf('relative rounded-2xl overflow-hidden bg-brand-cream aspect')
    if ($idx -ge 0) {
        Write-Host 'Found at index:' $idx
        Write-Host 'Context:' $content.Substring($idx, 500)
    }
}