const CACHE_NAME = "phonics-quiz-v1";
const FILES_TO_CACHE = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./whichLetterSays.mp3",
  "./buzzer.mp3",
  "./says.mp3",
  "./awww.mp3",
  "./victory1.mp3",
  "./victory2.mp3",
  "./a-name.mp3",
  "./b-name.mp3",
  "./c-name.mp3",
  "./d-name.mp3",
  "./e-name.mp3",
  "./f-name.mp3",
  "./g-name.mp3",
  "./h-name.mp3",
  "./i-name.mp3",
  "./j-name.mp3",
  "./k-name.mp3",
  "./l-name.mp3",
  "./m-name.mp3",
  "./n-name.mp3",
  "./o-name.mp3",
  "./p-name.mp3",
  "./q-name.mp3",
  "./r-name.mp3",
  "./s-name.mp3",
  "./t-name.mp3",
  "./u-name.mp3",
  "./v-name.mp3",
  "./w-name.mp3",
  "./x-name.mp3",
  "./y-name.mp3",
  "./z-name.mp3",
  "./a-sound.mp3",
  "./b-sound.mp3",
  "./c-sound.mp3",
  "./d-sound.mp3",
  "./e-sound.mp3",
  "./f-sound.mp3",
  "./g-sound.mp3",
  "./h-sound.mp3",
  "./i-sound.mp3",
  "./j-sound.mp3",
  "./k-sound.mp3",
  "./l-sound.mp3",
  "./m-sound.mp3",
  "./n-sound.mp3",
  "./o-sound.mp3",
  "./p-sound.mp3",
  "./q-sound.mp3",
  "./r-sound.mp3",
  "./s-sound.mp3",
  "./t-sound.mp3",
  "./u-sound.mp3",
  "./v-sound.mp3",
  "./w-sound.mp3",
  "./x-sound.mp3",
  "./y-sound.mp3",
  "./z-sound.mp3",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching files");
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
});
