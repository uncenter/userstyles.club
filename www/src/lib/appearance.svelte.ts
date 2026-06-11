class AppearanceSetting {
  #value = $state<string>(localStorage.getItem('appearance') ?? 'system');

  get current() {
    return this.#value;
  }
  set current(v: string) {
    this.#value = v;
    localStorage.setItem('appearance', v);
  }
}

export const appearance = new AppearanceSetting();
