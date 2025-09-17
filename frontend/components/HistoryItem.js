export default {
  template: `
    <div>
      <div v-if="collapsed">
        <button class="btn btn-secondary" @click="toggleCollapse">
          <span :style="{ background: eventTypeColor }">{{ item.eventType || 'TEST' }}</span> Show Details
        </button>
      </div>
      <div v-else>
        <button class="btn btn-secondary" @click="toggleCollapse">Hide Details</button><br>
        Date: {{ new Date(item.timestamp * 1000).toISOString() }}<br>
        EventType: {{ item.eventType }}<br>
        Passed: {{ item.passed }}<br>
        Error codes: {{ item.faultCodes }}<br>
        Grade score: {{ item.gradeScore }}<br>
        Location: {{ item.location }}<br>
        Test protocol raw file: <a :href="item.details.ipfsDataUrl" target="_blank">URL</a>
      </div>
    </div>
  `,
  data() {
    return {
      collapsed: true,
      eventTypeColor: {
        'QA_PASSED': 'green',
        'QA_FAILED': 'red',
        'SALE': 'blue',
      }[this.item.eventType] || 'black',
    };
  },
  props: {
    item: Object,    // Expecting an object as prop
    index: Number    // Expecting a number as prop
  },
  methods: {
    toggleCollapse() {
      this.collapsed = !this.collapsed;
    }
  },
};
