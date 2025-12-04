package com.rewear.post.controller;

import com.rewear.common.enums.PostType;
import com.rewear.organ.service.OrganService;
import com.rewear.post.dto.PostRequestDto;
import com.rewear.post.dto.PostResponseDto;
import com.rewear.post.entity.Post;
import com.rewear.post.repository.PostRepository;
import com.rewear.post.service.PostService;
import com.rewear.user.details.CustomUserDetails;
import com.rewear.user.entity.User;
import com.rewear.user.service.UserServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostApiController {

    private final PostService postService;
    private final UserServiceImpl userService;
    private final PostRepository postRepository;
    private final OrganService organService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    // 게시글 목록 조회
    @GetMapping
    public ResponseEntity<?> getPosts(
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @AuthenticationPrincipal CustomUserDetails principal) {
        try {
            log.debug("게시글 목록 조회 요청 - 타입: {}, 페이지: {}, 크기: {}", type, page, size);

            PostType postType = null;
            if (type != null && !type.isEmpty()) {
                try {
                    postType = PostType.valueOf(type.toUpperCase());
                } catch (IllegalArgumentException e) {
                    log.warn("잘못된 게시물 타입: {}", type);
                }
            }

            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<Post> posts;

            if (postType != null) {
                // 요청 게시판(ORGAN_REQUEST)인 경우, 현재 로그인한 기관이 작성한 게시물만 조회
                if (postType == PostType.ORGAN_REQUEST) {
                    if (principal == null) {
                        // 로그인하지 않은 경우 빈 목록 반환
                        posts = Page.empty(pageable);
                    } else {
                        User user = userService.findByUsername(principal.getUsername())
                                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));
                        
                        // 현재 사용자의 기관 찾기
                        var organOpt = organService.findByUserId(user.getId());
                        if (organOpt.isEmpty()) {
                            // 기관 정보가 없는 경우 빈 목록 반환
                            log.warn("기관 정보를 찾을 수 없음 - 사용자 ID: {}", user.getId());
                            posts = Page.empty(pageable);
                        } else {
                            // 해당 기관이 작성한 게시물만 조회
                            List<Post> organPosts = postService.getPostsByAuthorOrgan(organOpt.get().getId());
                            // 페이지네이션 처리
                            int start = (int) pageable.getOffset();
                            int end = Math.min((start + pageable.getPageSize()), organPosts.size());
                            List<Post> pagedPosts = start < organPosts.size() ? organPosts.subList(start, end) : new ArrayList<>();
                            
                            posts = new org.springframework.data.domain.PageImpl<>(
                                    pagedPosts,
                                    pageable,
                                    organPosts.size()
                            );
                            log.debug("기관 게시글 조회 완료 - 기관 ID: {}, 개수: {}", organOpt.get().getId(), organPosts.size());
                        }
                    }
                } else {
                    // 기부 후기 등 다른 타입은 전체 조회
                    posts = postService.getPostsByType(postType, pageable);
                }
            } else {
                // 전체 게시물 조회 (기부 후기 기본)
                posts = postService.getPostsByType(PostType.DONATION_REVIEW, pageable);
            }

            List<PostResponseDto> postDtos = posts.getContent().stream()
                    .map(post -> convertToPostResponseDto(post, principal))
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("content", postDtos);
            response.put("totalElements", posts.getTotalElements());
            response.put("totalPages", posts.getTotalPages());
            response.put("currentPage", posts.getNumber());
            response.put("size", posts.getSize());

            log.debug("게시글 목록 조회 완료 - 타입: {}, 개수: {}", postType, posts.getTotalElements());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("게시글 목록 조회 실패 - 타입: {}, 페이지: {}", type, page, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "게시글 목록을 불러오는 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // 게시글 상세 조회
    @GetMapping("/{postId}")
    public ResponseEntity<?> getPost(
            @PathVariable Long postId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        try {
            log.debug("게시글 상세 조회 요청 - ID: {}", postId);
            Post post = postService.getPostById(postId);

            // 조회수 증가는 별도 API로 처리하거나, 여기서 처리할 수 있음
            // 현재는 조회수 증가를 Front에서 별도로 처리하는 것으로 가정

            PostResponseDto dto = convertToPostResponseDto(post, principal);
            log.debug("게시글 상세 조회 완료 - ID: {}, 제목: {}", postId, post.getTitle());
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            log.error("게시글 상세 조회 실패 - ID: {}", postId, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "게시글을 불러오는 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // 게시글 작성
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createPost(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestBody PostRequestDto requestDto) {
        try {
            log.debug("게시글 작성 요청 - 타입: {}, 사용자: {}", 
                    requestDto.getPostType(), principal != null ? principal.getUsername() : "null");

            if (principal == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "로그인이 필요합니다.");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            User author = userService.findByUsername(principal.getUsername())
                    .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

            // PostForm으로 변환
            com.rewear.post.PostForm form = new com.rewear.post.PostForm();
            form.setPostType(requestDto.getPostType());
            form.setTitle(requestDto.getTitle());
            form.setContent(requestDto.getContent());
            form.setIsAnonymous(requestDto.getIsAnonymous());
            form.setReqGenderType(requestDto.getReqGenderType());
            form.setReqMainCategory(requestDto.getReqMainCategory());
            form.setReqDetailCategory(requestDto.getReqDetailCategory());
            form.setReqSize(requestDto.getReqSize());

            // Base64 이미지를 파일로 저장하고 PostForm에 설정
            List<String> savedImageUrls = new ArrayList<>();
            if (requestDto.getImages() != null && !requestDto.getImages().isEmpty()) {
                for (String base64Image : requestDto.getImages()) {
                    if (base64Image != null && !base64Image.isEmpty()) {
                        String savedUrl = saveBase64Image(base64Image);
                        if (savedUrl != null) {
                            savedImageUrls.add(savedUrl);
                        }
                    }
                }
            }

            Post post = postService.createPost(author, form, null);
            
            // 이미지 URL 업데이트 (Base64로 저장한 이미지)
            if (!savedImageUrls.isEmpty()) {
                post.setImageUrls(String.join(",", savedImageUrls));
                if (post.getImageUrl() == null || post.getImageUrl().isEmpty()) {
                    post.setImageUrl(savedImageUrls.get(0));
                }
                post = postRepository.save(post);
            }

            PostResponseDto responseDto = convertToPostResponseDto(post, principal);
            log.info("게시글 작성 완료 - ID: {}, 타입: {}, 사용자: {}", 
                    post.getId(), requestDto.getPostType(), principal.getUsername());
            return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
        } catch (IllegalStateException e) {
            log.error("게시글 작성 실패 - 사용자 없음", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "사용자를 찾을 수 없습니다.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            log.error("게시글 작성 실패 - 예상치 못한 오류", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "게시글 작성 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // 게시글 수정
    @PutMapping("/{postId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updatePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestBody PostRequestDto requestDto) {
        try {
            log.debug("게시글 수정 요청 - ID: {}, 사용자: {}", 
                    postId, principal != null ? principal.getUsername() : "null");

            if (principal == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "로그인이 필요합니다.");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            User author = userService.findByUsername(principal.getUsername())
                    .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

            Post post = postService.getPostById(postId);
            
            // 작성자 확인
            boolean isAuthor = false;
            if (post.getAuthorUser() != null && post.getAuthorUser().getId().equals(author.getId())) {
                isAuthor = true;
            } else if (post.getAuthorOrgan() != null && post.getAuthorOrgan().getUser() != null
                    && post.getAuthorOrgan().getUser().getId().equals(author.getId())) {
                isAuthor = true;
            }

            if (!isAuthor) {
                log.warn("게시글 수정 실패 - 작성자 불일치, 게시물 ID: {}, 사용자: {}", 
                        postId, principal.getUsername());
                Map<String, Object> error = new HashMap<>();
                error.put("error", "본인이 작성한 게시물만 수정할 수 있습니다.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }

            // PostForm으로 변환
            com.rewear.post.PostForm form = new com.rewear.post.PostForm();
            form.setPostType(requestDto.getPostType());
            form.setTitle(requestDto.getTitle());
            form.setContent(requestDto.getContent());
            form.setIsAnonymous(requestDto.getIsAnonymous());
            form.setReqGenderType(requestDto.getReqGenderType());
            form.setReqMainCategory(requestDto.getReqMainCategory());
            form.setReqDetailCategory(requestDto.getReqDetailCategory());
            form.setReqSize(requestDto.getReqSize());

            // Base64 이미지를 파일로 저장하고 PostForm에 설정
            List<String> savedImageUrls = new ArrayList<>();
            if (requestDto.getImages() != null && !requestDto.getImages().isEmpty()) {
                for (String base64Image : requestDto.getImages()) {
                    if (base64Image != null && !base64Image.isEmpty()) {
                        String savedUrl = saveBase64Image(base64Image);
                        if (savedUrl != null) {
                            savedImageUrls.add(savedUrl);
                        }
                    }
                }
            }

            Post updatedPost = postService.updatePost(postId, author, form, null);
            
            // 이미지 URL 업데이트 (Base64로 저장한 이미지)
            if (!savedImageUrls.isEmpty()) {
                updatedPost.setImageUrls(String.join(",", savedImageUrls));
                if (updatedPost.getImageUrl() == null || updatedPost.getImageUrl().isEmpty()) {
                    updatedPost.setImageUrl(savedImageUrls.get(0));
                }
                updatedPost = postRepository.save(updatedPost);
            }

            PostResponseDto responseDto = convertToPostResponseDto(updatedPost, principal);
            log.info("게시글 수정 완료 - ID: {}, 사용자: {}", postId, principal.getUsername());
            return ResponseEntity.ok(responseDto);
        } catch (IllegalStateException e) {
            log.error("게시글 수정 실패 - 사용자 없음, 게시물 ID: {}", postId, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "사용자를 찾을 수 없습니다.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (IllegalArgumentException e) {
            log.error("게시글 수정 실패 - 잘못된 인자, 게시물 ID: {}", postId, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            log.error("게시글 수정 실패 - 예상치 못한 오류, 게시물 ID: {}", postId, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "게시글 수정 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // 게시글 삭제
    @DeleteMapping("/{postId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        try {
            log.debug("게시글 삭제 요청 - ID: {}, 사용자: {}", 
                    postId, principal != null ? principal.getUsername() : "null");

            if (principal == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "로그인이 필요합니다.");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            User author = userService.findByUsername(principal.getUsername())
                    .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

            postService.deletePost(postId, author);
            log.info("게시글 삭제 완료 - ID: {}, 사용자: {}", postId, principal.getUsername());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "게시글이 삭제되었습니다.");
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            log.error("게시글 삭제 실패 - 사용자 없음, 게시물 ID: {}", postId, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "사용자를 찾을 수 없습니다.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (IllegalArgumentException e) {
            log.error("게시글 삭제 실패 - 잘못된 인자, 게시물 ID: {}", postId, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            log.error("게시글 삭제 실패 - 예상치 못한 오류, 게시물 ID: {}", postId, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "게시글 삭제 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // 조회수 증가
    @PutMapping("/{postId}/view")
    public ResponseEntity<?> incrementViewCount(@PathVariable Long postId) {
        try {
            log.debug("조회수 증가 요청 - ID: {}", postId);
            Post post = postService.getPostById(postId);
            post.setViewCount((post.getViewCount() != null ? post.getViewCount() : 0) + 1);
            post = postRepository.save(post);
            Map<String, Object> response = new HashMap<>();
            response.put("viewCount", post.getViewCount());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("조회수 증가 실패 - ID: {}", postId, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "조회수 증가 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Post 엔티티를 PostResponseDto로 변환
    private PostResponseDto convertToPostResponseDto(Post post, CustomUserDetails principal) {
        // 작성자 정보
        String writer = "익명";
        String writerType = null;
        Long writerId = null;
        
        if (post.getAuthorUser() != null) {
            if (post.getIsAnonymous() != null && post.getIsAnonymous()) {
                writer = "익명";
            } else {
                writer = post.getAuthorUser().getUsername();
            }
            writerType = "user";
            writerId = post.getAuthorUser().getId();
        } else if (post.getAuthorOrgan() != null) {
            writer = post.getAuthorOrgan().getOrgName();
            writerType = "organ";
            writerId = post.getAuthorOrgan().getId();
        }

        // 작성자 확인
        boolean isAuthor = false;
        if (principal != null) {
            if (post.getAuthorUser() != null && principal.getUsername().equals(post.getAuthorUser().getUsername())) {
                isAuthor = true;
            } else if (post.getAuthorOrgan() != null && post.getAuthorOrgan().getUser() != null
                    && principal.getUsername().equals(post.getAuthorOrgan().getUser().getUsername())) {
                isAuthor = true;
            }
        }

        // 이미지 처리
        List<PostResponseDto.ImageDto> images = new ArrayList<>();
        if (post.getImageUrls() != null && !post.getImageUrls().isEmpty()) {
            log.info("기부 ID: {} - imageUrls 값: {}", post.getId(), post.getImageUrls());
            String[] urlArray = post.getImageUrls().split(",");
            for (String url : urlArray) {
                String trimmedUrl = url.trim();
                if (!trimmedUrl.isEmpty()) {
                    String fullUrl = trimmedUrl.startsWith("/uploads/") ? trimmedUrl : "/uploads/" + trimmedUrl;
                    log.info("기부 ID: {} - 이미지 URL 변환: {} -> {}", post.getId(), trimmedUrl, fullUrl);
                    PostResponseDto.ImageDto imageDto = PostResponseDto.ImageDto.builder()
                            .url(fullUrl)
                            .dataUrl(fullUrl)
                            .build();
                    images.add(imageDto);
                }
            }
        } else if (post.getImageUrl() != null && !post.getImageUrl().isEmpty()) {
            log.info("기부 ID: {} - imageUrl 값: {}", post.getId(), post.getImageUrl());
            String fullUrl = post.getImageUrl().startsWith("/uploads/") 
                ? post.getImageUrl() 
                : "/uploads/" + post.getImageUrl();
            log.info("기부 ID: {} - 이미지 URL 변환: {} -> {}", post.getId(), post.getImageUrl(), fullUrl);
            PostResponseDto.ImageDto imageDto = PostResponseDto.ImageDto.builder()
                    .url(fullUrl)
                    .dataUrl(fullUrl)
                    .build();
            images.add(imageDto);
        } else {
            log.warn("기부 ID: {} - 이미지 URL이 없습니다. imageUrl: {}, imageUrls: {}", 
                post.getId(), post.getImageUrl(), post.getImageUrls());
        }
        log.info("기부 ID: {} - 최종 이미지 개수: {}", post.getId(), images.size());

        return PostResponseDto.builder()
                .id(post.getId())
                .postType(post.getPostType())
                .title(post.getTitle())
                .content(post.getContent())
                .images(images)
                .isAnonymous(post.getIsAnonymous())
                .writer(writer)
                .writerType(writerType)
                .writerId(writerId)
                .reqGenderType(post.getReqGenderType())
                .reqMainCategory(post.getReqMainCategory())
                .reqDetailCategory(post.getReqDetailCategory())
                .reqSize(post.getReqSize())
                .viewCount(post.getViewCount())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .isAuthor(isAuthor)
                .build();
    }

    // Base64 이미지를 파일로 저장
    private String saveBase64Image(String base64Image) {
        try {
            if (base64Image == null || base64Image.isEmpty()) {
                return null;
            }

            // Base64 데이터 URL 형식: data:image/png;base64,iVBORw0KGgo...
            String[] parts = base64Image.split(",");
            if (parts.length != 2) {
                log.warn("잘못된 Base64 이미지 형식");
                return null;
            }

            String base64Data = parts[1];
            String header = parts[0];
            String extension = ".jpg";
            if (header.contains("image/png")) {
                extension = ".png";
            } else if (header.contains("image/gif")) {
                extension = ".gif";
            }

            byte[] imageBytes = Base64.getDecoder().decode(base64Data);
            String filename = UUID.randomUUID().toString() + extension;

            // 업로드 디렉토리 확인 및 생성
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 파일 저장
            Path filePath = uploadPath.resolve(filename);
            Files.write(filePath, imageBytes);

            log.info("Base64 이미지 저장 완료: {}", filename);
            return filename;
        } catch (Exception e) {
            log.error("Base64 이미지 저장 실패", e);
            return null;
        }
    }
}

