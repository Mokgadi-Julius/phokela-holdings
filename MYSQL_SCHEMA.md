### Database Schema for Services

**`services` table:**

*   `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
*   `name` (VARCHAR(255), NOT NULL) - e.g., "Catering", "Conference", "Events"
*   `description` (TEXT)
*   `image` (VARCHAR(255))

**`service_sections` table:**

*   `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
*   `service_id` (INT, FOREIGN KEY REFERENCES `services(id)`)
*   `title` (VARCHAR(255), NOT NULL)
*   `content` (TEXT)
*   `type` (VARCHAR(50)) - e.g., "menu", "packages", "gallery"

**`service_items` table:**

*   `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
*   `section_id` (INT, FOREIGN KEY REFERENCES `service_sections(id)`)
*   `name` (VARCHAR(255), NOT NULL)
*   `description` (TEXT)
*   `price` (VARCHAR(255))
*   `image` (VARCHAR(255))
*   `attributes` (JSON) - for storing additional data like capacity, duration, etc.
