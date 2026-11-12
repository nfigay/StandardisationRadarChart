// Shared published roadmap fixture.
export function catalog(status='published'){
  return {
    organizations:[{organizationId:'org',name:'Org'}],
    portfolios:[{
      portfolioId:'port',
      ownerOrganizationId:'org',name:'Portfolio'
    }],
    standards:[
      {standardId:'iso-a',name:'ISO A'},
      {standardId:'iso-b',name:'ISO B — unrelated'}
    ],
    assessments:[],
    radarRevisions:[{
      revisionId:'rev',radarId:'roadmap',
      ownerOrganizationId:'org',
      portfolioId:'port',
      status,title:'Roadmap exemple',
      version:'1.0.0',
      blips:[{
        blipId:'b1',standardId:'iso-a',
        label:'Blip A',
        ring:'adopt',quadrant:'standards',
        position:{x:3,y:5}
      }]
    }]
  };
}
