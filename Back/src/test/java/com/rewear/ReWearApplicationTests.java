package com.rewear;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rewear.email.service.EmailSendService;
import com.rewear.common.enums.DonationStatus;
import com.rewear.donation.repository.DonationRepository;
import com.rewear.organ.repository.OrganRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.net.CookieManager;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Path;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrlPattern;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=jdbc:h2:mem:rewear-test;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.mail.host=localhost",
        "spring.mail.username=sender@example.invalid",
        "rewear.admin.username=testadmin",
        "rewear.admin.email=admin@example.invalid",
        "rewear.admin.phone=01000000000",
        "rewear.user.username=testmember",
        "rewear.organ.username=testorgan",
        "rewear.organ.business-no=0000000000",
        "rewear.organ.org-name=Test Organization",
        "rewear.organ.auto-approve=true"
})
@AutoConfigureMockMvc
class ReWearApplicationTests {

    private static final String PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+W3ioAAAAASUVORK5CYII=";
    private static final String TEST_PASSWORD = UUID.randomUUID().toString();
    private static final Path TEST_UPLOADS = Path.of("build", "test-uploads", UUID.randomUUID().toString()).toAbsolutePath();

    @Autowired
    private MockMvc mvc;

    @LocalServerPort
    private int port;

    @Autowired
    private ObjectMapper json;

    @Autowired
    private DonationRepository donations;

    @Autowired
    private OrganRepository organs;

    @MockBean
    private EmailSendService emailSender;

    @DynamicPropertySource
    static void testProperties(DynamicPropertyRegistry registry) {
        registry.add("app.upload.dir", TEST_UPLOADS::toString);
        registry.add("spring.mail.password", () -> TEST_PASSWORD);
        registry.add("rewear.admin.password", () -> TEST_PASSWORD);
        registry.add("rewear.user.password", () -> TEST_PASSWORD);
        registry.add("rewear.organ.password", () -> TEST_PASSWORD);
    }

    @Test
    void loginRotatesSessionAndLogoutRevokesAccess() throws Exception {
        MockHttpSession session = new MockHttpSession();
        String previousId = session.getId();
        MockHttpSession authenticated = login("testmember", session);
        assertNotEquals(previousId, authenticated.getId());

        mvc.perform(get("/api/users/me").session(authenticated)).andExpect(status().isOk());
        mvc.perform(get("/api/users").session(authenticated)).andExpect(status().isForbidden());
        mvc.perform(get("/api/users/1").session(authenticated)).andExpect(status().isForbidden());
        mvc.perform(delete("/api/users/1").session(authenticated).with(csrf())).andExpect(status().isForbidden());
        mvc.perform(post("/api/logout").session(authenticated)).andExpect(status().isForbidden());
        mvc.perform(post("/api/logout").session(authenticated).with(csrf())).andExpect(status().isNoContent());
        mvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void donationSubmissionApprovalAndMatchingEligibilityRequireCorrectRoles() throws Exception {
        MockHttpSession member = login("testmember", new MockHttpSession());
        MockHttpSession admin = login("testadmin", new MockHttpSession());
        var submitted = mvc.perform(post("/api/donations").session(member).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "itemType", "남성 의류",
                                "itemDetail", "상의",
                                "itemSize", "M",
                                "itemCondition", "새상품",
                                "itemDescription", "Test clothing",
                                "donationMethod", "자동 매칭",
                                "deliveryMethod", "직접 배송",
                                "isAnonymous", false,
                                "contact", "01000000000",
                                "images", List.of("data:image/png;base64," + PNG)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();
        long donationId = json.readTree(submitted.getResponse().getContentAsByteArray()).get("donationId").asLong();
        signup("othermember", "othermember@example.invalid");
        MockHttpSession other = login("othermember", new MockHttpSession());
        mvc.perform(put("/api/donations/" + donationId + "/cancel").session(other).with(csrf()))
                .andExpect(status().isForbidden());
        assertEquals(DonationStatus.PENDING, donations.findById(donationId).orElseThrow().getStatus());

        String approve = "/api/admin/donations/" + donationId + "/approve";
        mvc.perform(post(approve).session(member).with(csrf())).andExpect(status().isForbidden());
        mvc.perform(post(approve).session(admin).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
        mvc.perform(get("/api/admin/donations/auto-match").session(admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.donations[0].id").value(donationId));

        long organId = organs.findAll().getFirst().getId();
        mvc.perform(post("/api/admin/donations/" + donationId + "/assign").session(admin).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("organId", organId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
        MockHttpSession organ = login("testorgan", new MockHttpSession());
        mvc.perform(post("/api/organs/donations/" + donationId + "/approve").session(organ).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
        assertEquals(DonationStatus.COMPLETED, donations.findById(donationId).orElseThrow().getStatus());
    }

    @Test
    void signupCreatesAnOrdinaryAccountAndVerificationUsesMockMail() throws Exception {
        String email = "newmember@example.invalid";
        mvc.perform(post("/api/auth/send-verification").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", email))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true));
        verify(emailSender).sendEmail(eq(email), anyString(), anyString());

        signup("newmember", email);
        login("newmember", new MockHttpSession());
    }

    private void signup(String username, String email) throws Exception {
        mvc.perform(post("/api/users/signup").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "username", username,
                                "password", TEST_PASSWORD,
                                "name", "Test Member",
                                "email", email,
                                "phone", "01000000000",
                                "addressPostcode", "00000",
                                "address", "Test address"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roles[0]").value("USER"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void thymeleafMultipartFormAcceptsImageWithCsrf() throws Exception {
        MockHttpSession member = login("testmember", new MockHttpSession());
        MockMultipartFile image = new MockMultipartFile("images", "item.png", "image/png",
                Base64.getDecoder().decode(PNG));

        mvc.perform(multipart("/donations/apply/item").file(image).session(member))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/main"));
        mvc.perform(multipart("/donations/apply/item").file(image).session(member).with(csrf())
                        .param("genderType", "UNISEX")
                        .param("mainCategory", "TOP")
                        .param("size", "M"))
                .andExpect(redirectedUrlPattern("/donations/apply/method*"));
    }

    @Test
    void embeddedServerReadsCsrfFieldFromMultipartSubmission() throws Exception {
        HttpClient client = HttpClient.newBuilder().cookieHandler(new CookieManager()).build();
        URI base = URI.create("http://localhost:" + port);
        var token = csrfToken(client, base);
        var login = HttpRequest.newBuilder(base.resolve("/api/users/login"))
                .header("Content-Type", "application/json")
                .header(token.get("headerName").asText(), token.get("token").asText())
                .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(
                        Map.of("username", "testmember", "password", TEST_PASSWORD))))
                .build();
        var loginResponse = client.send(login, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, loginResponse.statusCode());
        assertEquals(true, json.readTree(loginResponse.body()).get("ok").asBoolean());

        token = csrfToken(client, base);
        String boundary = UUID.randomUUID().toString();
        var multipart = new StringBuilder();
        Map.of(token.get("parameterName").asText(), token.get("token").asText(),
                "genderType", "UNISEX", "mainCategory", "TOP", "size", "M").forEach((key, value) ->
                        multipart.append("--").append(boundary)
                                .append("\r\nContent-Disposition: form-data; name=\"").append(key)
                                .append("\"\r\n\r\n").append(value).append("\r\n"));
        multipart.append("--").append(boundary)
                .append("\r\nContent-Disposition: form-data; name=\"images\"; filename=\"item.png\"")
                .append("\r\nContent-Type: image/png\r\n\r\n");

        var form = HttpRequest.newBuilder(base.resolve("/donations/apply/item"))
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.concat(
                        HttpRequest.BodyPublishers.ofString(multipart.toString()),
                        HttpRequest.BodyPublishers.ofByteArray(Base64.getDecoder().decode(PNG)),
                        HttpRequest.BodyPublishers.ofString("\r\n--" + boundary + "--\r\n")))
                .build();
        var response = client.send(form, HttpResponse.BodyHandlers.discarding());
        assertEquals(302, response.statusCode());
        assertEquals("/donations/apply/method",
                base.resolve(response.headers().firstValue("Location").orElseThrow()).getPath());
    }

    private com.fasterxml.jackson.databind.JsonNode csrfToken(HttpClient client, URI base) throws Exception {
        var request = HttpRequest.newBuilder(base.resolve("/api/csrf")).GET().build();
        var response = client.send(request, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, response.statusCode());
        return json.readTree(response.body());
    }

    private MockHttpSession login(String username, MockHttpSession session) throws Exception {
        var result = mvc.perform(post("/api/users/login").session(session).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("username", username, "password", TEST_PASSWORD))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true))
                .andExpect(jsonPath("$.user.password").doesNotExist())
                .andReturn();
        MockHttpSession authenticated = (MockHttpSession) result.getRequest().getSession(false);
        assertNotNull(authenticated);
        return authenticated;
    }
}
