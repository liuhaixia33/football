export default defineAppConfig({
  pages: [
    'pages/login/index',
    'pages/team-select/index',
    'pages/onboard/index',
    'pages/create-team/index',
    'pages/join-team/index',
    'pages/home/index',
    'pages/activity-detail/index',
    'pages/activity-create/index',
    'pages/members/index',
    'pages/finance/index',
    'pages/finance-record/index',
    'pages/member-fee/index',
    'pages/my/index',
  ],
  tabBar: {
    custom: true,
    color: '#364a60',
    selectedColor: '#00e472',
    list: [
      { pagePath: 'pages/home/index', text: '首页' },
      { pagePath: 'pages/members/index', text: '队员' },
      { pagePath: 'pages/finance/index', text: '财务' },
      { pagePath: 'pages/my/index', text: '我的' },
    ],
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#0b0f18',
    navigationBarTitleText: '足球队',
    navigationBarTextStyle: 'white',
  },
})
