<?php
// Login settings stay on the server; never put these in index.html or JavaScript.
const STATS_ADMIN_USER = 'admin';
const STATS_ADMIN_PASSWORD_HASH = '$2y$10$mg2kRGeeYi1q0rO9f5qgkO6BzJm1wDsZTFWPuEk8BAx42EOUxgIXC';
// Override with an absolute path OUTSIDE the public web directory for deployment.
// The default is private to this installation, but temporary directories may be cleaned.
define('STATS_DATA_DIR', getenv('AUTHOR_STATS_DIR') ?: sys_get_temp_dir() . '/author-journey-' . substr(hash('sha256', __DIR__), 0, 16));
