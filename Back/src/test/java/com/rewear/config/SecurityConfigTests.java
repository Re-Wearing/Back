package com.rewear.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {CsrfController.class, SecurityConfigTests.ProbeController.class})
@Import(SecurityConfig.class)
class SecurityConfigTests {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private NotificationModelAttribute notificationModelAttribute;

    @Test
    void anonymousClientCanRequestAnUncacheableCsrfToken() throws Exception {
        mvc.perform(get("/api/csrf"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.headerName").value("X-CSRF-TOKEN"));
    }

    @Test
    void anonymousRequestsCannotAccessDonationApis() throws Exception {
        mvc.perform(get("/api/donations/probe"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void administratorApiRequiresBothRoleAndCsrfToken() throws Exception {
        mvc.perform(post("/api/admin/probe").with(user("tester").roles("USER")).with(csrf()))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/admin/probe").with(user("tester").roles("ADMIN")))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/admin/probe").with(user("tester").roles("ADMIN")).with(csrf()))
                .andExpect(status().isOk());
    }

    @RestController
    static class ProbeController {

        @GetMapping("/api/donations/probe")
        String donations() {
            return "donations";
        }

        @PostMapping("/api/admin/probe")
        String admin() {
            return "admin";
        }
    }
}
