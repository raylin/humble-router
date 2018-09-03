/* eslint-disable no-unused-expressions */
// @flow

import Router from './router';

describe('Basic', () => {
  it('no matched rule', () => {
    const router = new Router();
    router.define('/home');

    expect(router.match('/product')).toBeFalsy();
  });

  it('string rules', () => {
    const router = new Router();
    router.define('/home');
    router.define('/product/shoes/1/details');

    expect(router.match('/home')).toBeTruthy();
    expect(router.match('/product/shoes/1/details')).toBeTruthy();
  });

  it('matched raw route', () => {
    const router = new Router();
    const route1 = '/home';
    const route2 = '/product/shoes/1/details';

    const def1 = router.define(route1);
    const def2 = router.define(route2);

    const match1 = router.match(route1);
    const match2 = router.match(route2);

    expect(match1).toBeTruthy();
    expect(match2).toBeTruthy();

    expect(def1.path).toBe(route1);
    expect(match1 && match1.path).toBe(route1);
    expect(def2.path).toBe(route2);
    expect(match2 && match2.path).toBe(route2);
  });

  it('slash sensitive', () => {
    const router = new Router();
    router.define('/home/');

    expect(router.match('/home/')).toBeTruthy();
    expect(router.match('/home')).toBeFalsy();
  });

  it('regex rules', () => {
    const router = new Router();
    router.define('/(^(shoes|shirts)$)/');

    expect(router.match('/shoes/')).toBeTruthy();
    expect(router.match('/shirts/')).toBeTruthy();

    expect(router.match('/shoe')).toBeFalsy();
    expect(router.match('/shirt')).toBeFalsy();
  });

  it('wildcard at the end, ignore querystring', () => {
    const router = new Router();
    router.define('/product/?*');
    router.define('/items?*');

    expect(router.match('/product/')).toBeTruthy();
    expect(router.match('/product/?id=3')).toBeTruthy();
    expect(router.match('/items')).toBeTruthy();
    expect(router.match('/items?id=3')).toBeTruthy();

    expect(router.match('/product/3/')).toBeFalsy();
    expect(router.match('/homes')).toBeFalsy();
  });

  it('wildcard rules', () => {
    const router = new Router();
    router.define('/product/*/');
    router.define('/product/*/details');

    expect(router.match('/product/1/')).toBeTruthy();
    expect(router.match('/product/2/')).toBeTruthy();
    expect(router.match('/product/2/details')).toBeTruthy();

    expect(router.match('/homes')).toBeFalsy();
  });

  it('query string', () => {
    const router = new Router();
    router.define('/product/?item=3&size=5&color=brown');

    expect(router.match('/product/?item=3&color=brown&size=5')).toBeTruthy();
  });

  it('query string with wildcard', () => {
    const router = new Router();
    router.define('/product/?item=*&size=5&color=brown');

    expect(router.match('/product/?item=5&color=brown&size=5')).toBeTruthy();
    expect(router.match('/product/?item=6&color=brown&size=5')).toBeTruthy();
    expect(router.match('/product/?item=7&color=brown&size=5')).toBeTruthy();
    expect(router.match('/product/?item=7&color=brown&size=7')).toBeFalsy();
  });

  it('mixed rules', () => {
    const router = new Router();
    router.define('/home');
    router.define('/product/*/?item=*&color=red');
    router.define('/account/(^[0-9]{3,4}$)/coupons?status=active');

    expect(router.match('/home')).toBeTruthy();
    expect(router.match('/product/shirts/?item=7&color=red')).toBeTruthy();
    expect(router.match('/account/777/coupons?status=active')).toBeTruthy();

    expect(router.match('/product/shirts/?color=red')).toBeFalsy();
    expect(router.match('/product/shirts/?item=8&color=blue')).toBeFalsy();
    expect(router.match('/account/777/coupons?status=inactive')).toBeFalsy();
    expect(router.match('/account/777777/coupons?status=active')).toBeFalsy();
  });
});
