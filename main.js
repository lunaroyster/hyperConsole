let SuperSecretNamespace = {};
//SRC: https://stackoverflow.com/a/8618519
function whenAvailable(name, callback) {
    let interval = 10; // ms
    window.setTimeout(function() {
      if (window[name]) return callback(window[name]);
      window.setTimeout(arguments.callee, interval);
    }, interval);
}

SuperSecretNamespace.vm = new Vue({
  el: '#root',
  data() {
    return {
      search: '',
      results: [],
      fuse: null,
      librariesFetchPromise: null,
      loadedLibraries: [],
    };
  },
  async mounted() {
    let libraries = await this.getLibraries();
    await this.hide('Fuse');
    let { Fuse } = SuperSecretNamespace;
    this.fuse = new Fuse(libraries, {
      shouldSort: true,
      threshold: 0.6,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: ["name"]
    });
  },
  methods: {
    async hide(identifier) {
      let loadPromise = new Promise((resolve, reject)=> {
        whenAvailable(identifier, ()=> {
          SuperSecretNamespace[identifier] = window[identifier];
          delete window[identifier];
          resolve();
        });
      });
      return loadPromise;
    },
    async fetchLibraries() {
      let response = await window.fetch('https://api.cdnjs.com/libraries');
      let { results } = await response.json();
      return results;
    },
    async getLibraries() {
      if(!this.librariesFetchPromise) this.librariesFetchPromise = this.fetchLibraries();
      return await this.librariesFetchPromise;
    },
    async loadLibraryByURL(url) {
      let newScript = document.createElement('script');
      newScript.src = url;
      document.head.appendChild(newScript);
    },
    async loadLibraryByName(name) {
      let libraries = await this.getLibraries();
      let library = libraries.find(lib => lib.name === name);
      await this.loadLibraryByURL(library.latest);
      this.loadedLibraries.push(library);
      console.log(`%cLoaded ${name}`, "font-style: italic");
    }
  },
  watch: {
    search(newTerm, oldTerm) {
      this.results = this.fuse.search(newTerm).slice(0, 20);
    },
  },
});