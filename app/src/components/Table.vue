<template>
  <div class="container">
    <div class="table-container my-2">
      <table
        id="tableComponent"
        class="table b-table table-bordered table-striped"
      >
        <thead>
          <tr>
            <!-- loop through each value of the fields to get the table header -->
            <th
              v-for="field in fields"
              :key="field.key"
              scope="col"
              :title="field.sortable ? `Sort by ${field.label}` : field.label"
              :aria-sort="field.sortable ? getAriaSort(field.key) : undefined"
            >
              <button v-if="field.sortable" type="button" class="sort-button" @click="sortTable(field.key)">{{ field.label }}</button>
              <span v-else>{{ field.label }}</span>
            </th>
            <th v-if="tableData.length">Edit</th>
            <th v-if="tableData.length">Delete</th>
          </tr>
        </thead>
        <tbody v-if="tableData.length > 0">
          <!-- Loop through the list get the each student data -->
          <tr v-for="item in sortedData" :key="item._id || item.id">
            <td v-for="field in fields" :key="field.key">
              {{ field.formatter ? field.formatter(item[field.key]) : item[field.key] }}
            </td>
            <td>
            <button
              class="btn btn-secondary"
              @click="$emit('edit', item)"
            >
              Edit
            </button>
          </td>
            <td>
            <button
              class="btn btn-danger"
              @click="$emit('delete', item)"
            >
              Delete
            </button>
          </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td :colspan="fields.length" class="text-center">
              No results found
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: "TableComponent",
  emits: ["edit", "delete"],
  props: {
    tableData: { type: Array, required: true },
    fields: { type: Array, required: true },
    sortBy: { type: String, default: "" },
  },
  data() { return { currentSort: "", ascending: true }; },
  computed: {
    activeSort() {
      return this.currentSort || this.sortBy || this.fields.find(field => field.sortable)?.key;
    },
    sortedData() {
      const column = this.activeSort;
      const rows = [...this.tableData];
      if (!column) return rows;
      return rows.sort((a, b) => {
        const order = a[column] === b[column] ? 0 : a[column] > b[column] ? 1 : -1;
        return this.ascending ? order : -order;
      });
    },
  },
  methods: {
    sortTable(column) {
      this.ascending = this.activeSort === column ? !this.ascending : true;
      this.currentSort = column;
    },
    getAriaSort(column) {
      return this.activeSort === column ? (this.ascending ? "ascending" : "descending") : "none";
    },
  },
};
</script>

<style scoped>
.sort-button {
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: inherit;
  width: 100%;
}

@media (max-width: 768px) {
  .table-container {
    width: 100%;
    overflow: scroll;
  }
}

th {
  vertical-align: middle;
  text-align: center !important;
}

.table.b-table > tfoot > tr > [aria-sort],
.table.b-table > thead > tr > [aria-sort] {
  cursor: pointer;
  background-image: none;
  background-repeat: no-repeat;
  background-size: 0.65em 1em;
}

.table.b-table > tfoot > tr > [aria-sort="none"],
.table.b-table > thead > tr > [aria-sort="none"] {
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='101' height='101' preserveAspectRatio='none'%3E%3Cpath opacity='.3' d='M51 1l25 23 24 22H1l25-22zm0 100l25-23 24-22H1l25 22z'/%3E%3C/svg%3E");
}

.table.b-table > tfoot > tr > [aria-sort]:not(.b-table-sort-icon-left),
.table.b-table > thead > tr > [aria-sort]:not(.b-table-sort-icon-left) {
  background-position: right 0.375rem center;
  padding-right: calc(0.75rem + 0.65em);
}

.table.b-table > tfoot > tr > [aria-sort="ascending"],
.table.b-table > thead > tr > [aria-sort="ascending"] {
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='101' height='101' preserveAspectRatio='none'%3E%3Cpath d='M51 1l25 23 24 22H1l25-22z'/%3E%3Cpath opacity='.3' d='M51 101l25-23 24-22H1l25 22z'/%3E%3C/svg%3E");
}

.table.b-table > tfoot > tr > [aria-sort="descending"],
.table.b-table > thead > tr > [aria-sort="descending"] {
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='101' height='101' preserveAspectRatio='none'%3E%3Cpath opacity='.3' d='M51 1l25 23 24 22H1l25-22z'/%3E%3Cpath d='M51 101l25-23 24-22H1l25 22z'/%3E%3C/svg%3E");
}
</style>
