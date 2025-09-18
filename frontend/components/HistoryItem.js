export default {
  template: `
    <div style="background: #1c1f20;box-shadow: 0 6px 24px rgba(255, 255, 255, 0.247);border-radius: 16px; margin-bottom: 24px; padding: 18px 24px; font-family: 'Inter', Arial, sans-serif;">
      <div v-if="collapsed">
        <button class="btn btn-secondary" @click="toggleCollapse" style="font-weight:600; font-size:1.05rem; background:#152a5a; color:#f0f8ff; border-radius:10px; padding:10px 18px;">
          <span :style="{ background: eventTypeColor, color: '#f0f8ff', borderRadius: '8px', padding: '4px 12px', fontWeight: '600', marginRight: '12px', boxShadow: '0 2px 8px #0c1a3d44' }">{{ item.eventType || 'TEST' }}</span>
          Show Details
        </button>
      </div>
      <div v-else>
        <button class="btn btn-secondary" @click="toggleCollapse" style="font-weight:600; font-size:1.05rem; background:#152a5a; color:#f0f8ff; border-radius:10px; padding:10px 18px;">
          <span :style="{ background: eventTypeColor, color: '#f0f8ff', borderRadius: '8px', padding: '4px 12px', fontWeight: '600', marginRight: '12px', boxShadow: '0 2px 8px #0c1a3d44' }">{{ item.eventType || 'TEST' }}</span>
          Hide Details
        </button>
        <hr style="border:1px solid #e5e7eb; margin:16px 0;" />
        <table style="width:100%; border-collapse:separate; border-spacing:0; font-size:1rem;">
          <tbody>
            <tr>
              <td style="padding:8px 10px; color: #f0f8ff; font-weight:600;">Date</td>
              <td style="padding:8px 10px;">{{ new Date(item.timestamp * 1000).toLocaleString() }}</td>
            </tr>
            <tr>
              <td style="padding:8px 10px; color: #f0f8ff; font-weight:600;">Event Type</td>
              <td style="padding:8px 10px;">{{ item.eventType }}</td>
            </tr>
            <tr>
              <td style="padding:8px 10px; color: #f0f8ff; font-weight:600;">Passed</td>
              <td style="padding:8px 10px;">{{ item.passed }}</td>
            </tr>
            <tr>
              <td style="padding:8px 10px; color: #f0f8ff; font-weight:600;">Error Codes</td>
              <td style="padding:8px 10px;">{{ item.faultCodes }}</td>
            </tr>
            <tr>
              <td style="padding:8px 10px; color: #f0f8ff; font-weight:600;">Grade Score</td>
              <td style="padding:8px 10px;">{{ item.gradeScore }}</td>
            </tr>
            <tr>
              <td style="padding:8px 10px; color: #f0f8ff; font-weight:600;">Location</td>
              <td style="padding:8px 10px;">{{ item.location }}</td>
            </tr>
            <tr>
              <td style="padding:8px 10px; color: #f0f8ff; font-weight:600;">Test Protocol Raw File</td>
              <td style="padding:8px 10px;"><a :href="item.details.ipfsDataUrl" target="_blank" style="color:#00c8d2; font-weight:600; text-decoration:underline;">URL</a></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  data() {
    return {
      collapsed: true,
      eventTypeColor: {
        'QA_PASSED': '#00c8d2',
        'QA_FAILED': '#ff9c00',
        'SALE': '#152a5a',
      }[this.item.eventType] || '#0c1a3d',
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
