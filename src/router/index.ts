import {createRouter, createWebHashHistory, type RouteRecordRaw} from 'vue-router';
import App from '@/pages/App.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: App,
    redirect: '/playlist',
    children: [{
      path: 'playlist',
      component: () => import('@/pages/Playlist.vue')
    },{
      path: 'playlistDetail',
      component: () => import('@/pages/PlaylistDetail.vue')
    },{
      path: 'search',
      component: () => import('@/pages/Search.vue')
    },{
      path: 'userCenter',
      component: () => import('@/pages/UserCenter.vue')
    },{
      path: 'settings',
      component: () => import('@/pages/Settings.vue')
    }]
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
