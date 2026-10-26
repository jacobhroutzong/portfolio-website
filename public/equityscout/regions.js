'use strict';
// Geography selects a research queue. It never changes underwriting or evidence gates.
const scoutRegions = (() => {
  const southeast = Object.freeze(['FL','AL','GA','SC','NC','TN','MS']);
  const us = new Set('AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'.split(' '));
  const normalize = value => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g,'');
  const state = value => String(value || '').trim().toUpperCase();
  function shortlisted(deal, markets) {
    return (markets[state(deal.state)] || []).some(city => normalize(city) === normalize(deal.city));
  }
  function scope(deals, markets, region = 'southeast', shortlistOnly = true) {
    return deals.filter(deal => region === 'nationwide'
      ? us.has(state(deal.state))
      : southeast.includes(state(deal.state)) && (!shortlistOnly || shortlisted(deal, markets)));
  }
  function catalog(markets, region = 'southeast') {
    return Object.fromEntries((region === 'nationwide' ? Object.keys(markets) : southeast)
      .filter(key => markets[key]?.length).map(key => [key,markets[key]]));
  }
  return Object.freeze({southeast,scope,catalog,shortlisted});
})();
