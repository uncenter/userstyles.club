import { browser } from '$app/environment';

class AppearanceSetting {
  #value = $state<string>(browser ? (localStorage.getItem('appearance') ?? 'system') : 'system');

  get current() {
    return this.#value;
  }
  set current(v: string) {
    this.#value = v;
    if (browser) localStorage.setItem('appearance', v);
  }
}

export const appearance = new AppearanceSetting();
