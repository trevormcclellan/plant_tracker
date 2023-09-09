<template>
  <div>
    <router-view />
  </div>
</template>

<script>
</script>

<style>
    #app {
      font-family: Avenir, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-align: center;
      color: #2c3e50;
    }

    nav {
      padding: 30px;
    }

    nav a {
      font-weight: bold;
      color: #2c3e50;
    }

    nav a.router-link-exact-active {
      color: #42b983;
    }

    /* Table Styles */
    table {
      width: 100%;
      border-collapse: collapse;
    }

    th,
    td {
      padding: 10px;
      border: 1px solid #ccc;
    }

    th {
      background-color: #f0f0f0;
    }

    tbody tr:nth-child(even) {
      background-color: #f9f9f9;
    }

    /* Additional Styles */
    h1 {
      margin-bottom: 20px;
    }

    h2 {
      margin: 20px 0;
    }
    
</style>
