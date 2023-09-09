<template>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <a class="navbar-brand">DNS Records</a>
        <div class="collapse navbar-collapse">
            <ul class="navbar-nav mr-auto">
                <li class="nav-item active">
                    <a class="nav-link" @click="logout" href="#">Logout</a>
                </li>
            </ul>
        </div>
    </nav>
</template>

<script>
export default {
    methods: {
        logout() {
            this.$store.commit('setToken', null);
            this.$router.push('/login');
        }
    }
}
</script>
