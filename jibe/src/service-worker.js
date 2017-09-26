/**
 * service-worker.js
 */


var CACHE_NAME = 'swjibe-v1';
var urlsToCache = [
  '/',
  '/web/assets/images/gear.png',
  '/web/assets/images/Schlumberger.svg',
  '/web/assets/images/activities/bha_drilling_string_1.png',
  '/web/assets/images/activities/bit_selection.png',
  '/web/assets/images/activities/cementing.png',
  '/web/assets/images/activities/drilling_fluid_1.png',
  '/web/assets/images/activities/drilling_parameters.png',
  '/web/assets/images/activities/formation_tops.png',
  '/web/assets/images/activities/fracture_pressure.png',
  '/web/assets/images/activities/iar.png',
  '/web/assets/images/activities/noimage.jpg',
  '/web/assets/images/activities/pore_pressure.png',
  '/web/assets/images/activities/project_1.png',
  '/web/assets/images/activities/report.png',
  '/web/assets/images/activities/rig.png',
  '/web/assets/images/activities/risks_1.png',
  '/web/assets/images/activities/surface_location_1.png',
  '/web/assets/images/activities/target_1.png',
  '/web/assets/images/activities/trajectory_1.png',
  '/web/assets/images/activities/unknown.png',
  '/web/assets/images/activities/well_information_1.png',
  '/web/assets/images/activities/wellbore_geometry_1.png',
  '/web/assets/images/activities/wellhead_bop.png',
  '/web/assets/ms/msal.min.js',

  '/web/src/components/activity-card.html',
  '/web/src/components/info-button.html',
  '/web/src/components/project-actions.html',
  '/web/src/components/project-card.html',
  '/web/src/components/project-create.html',
  '/web/src/misc/my-icons.html',
  '/web/src/misc/shared-styles.html',
  '/web/src/services/messages-service.html',
  '/web/src/services/projects-service.html',
  '/web/src/services/user-signin-behavior.html',
  '/web/src/services/user-signin-btn.html',
  '/web/src/my-app.html',
  '/web/src/my-events.html',
  '/web/src/my-groups.html',
  '/web/src/my-projects.html',
  '/web/src/my-view404.html',

  '/api/projects',
  '/api/messages',
];

// Listen for install event, set callback
self.addEventListener('install', function (event) {
  console.log('Install successful, scope is:', registration.scope);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', function(event) {
  console.log('Activate successful, scope is:', registration.scope);

  var cacheWhitelist = ['swjibe-v1'];
  
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }

        var fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                console.log('cached url:', event.request.url);                
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});