package com.rewear.config;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CsrfController {

    @GetMapping("/api/csrf")
    public ResponseEntity<CsrfToken> csrf(CsrfToken csrfToken) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(csrfToken);
    }
}
