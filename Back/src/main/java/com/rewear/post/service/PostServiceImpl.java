package com.rewear.post.service;

import com.rewear.common.enums.PostType;
import com.rewear.organ.entity.Organ;
import com.rewear.organ.service.OrganService;
import com.rewear.post.PostForm;
import com.rewear.post.entity.Post;
import com.rewear.post.repository.PostRepository;
import com.rewear.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final OrganService organService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public Post createPost(User author, PostForm form, MultipartFile image) {
        // 여러 이미지 저장
        String imageUrl = null;
        String imageUrls = null;
        List<String> savedImageUrls = new java.util.ArrayList<>();
        
        // 여러 이미지 처리 (우선)
        if (form.getImages() != null && !form.getImages().isEmpty()) {
            for (MultipartFile img : form.getImages()) {
                if (img != null && !img.isEmpty()) {
                    try {
                        String savedUrl = saveImage(img);
                        savedImageUrls.add(savedUrl);
                    } catch (IOException e) {
                        log.error("이미지 저장 실패", e);
                        throw new RuntimeException("이미지 저장에 실패했습니다.", e);
                    }
                }
            }
            if (!savedImageUrls.isEmpty()) {
                imageUrls = String.join(",", savedImageUrls);
                imageUrl = savedImageUrls.get(0); // 첫 번째 이미지를 imageUrl에도 설정 (하위 호환성)
            }
        }
        // 단일 이미지 처리 (하위 호환성)
        else if (image != null && !image.isEmpty()) {
            try {
                imageUrl = saveImage(image);
                savedImageUrls.add(imageUrl);
                imageUrls = imageUrl;
            } catch (IOException e) {
                log.error("이미지 저장 실패", e);
                throw new RuntimeException("이미지 저장에 실패했습니다.", e);
            }
        }

        Post.PostBuilder postBuilder = Post.builder()
                .postType(form.getPostType())
                .title(form.getTitle())
                .content(form.getContent())
                .imageUrl(imageUrl)
                .imageUrls(imageUrls);

        // 게시판 타입에 따라 작성자 설정
        if (form.getPostType() == PostType.DONATION_REVIEW) {
            // 기부 후기: 일반 회원 작성
            postBuilder.authorUser(author)
                    .isAnonymous(form.getIsAnonymous() != null ? form.getIsAnonymous() : false);
        } else if (form.getPostType() == PostType.ORGAN_REQUEST) {
            // 요청 게시물: 기관 작성
            Organ organ = organService.findByUserId(author.getId())
                    .orElseThrow(() -> new IllegalArgumentException("기관 정보를 찾을 수 없습니다."));
            postBuilder.authorOrgan(organ)
                    .reqGenderType(form.getReqGenderType())
                    .reqMainCategory(form.getReqMainCategory())
                    .reqDetailCategory(form.getReqDetailCategory())
                    .reqSize(form.getReqSize());
        }

        return postRepository.save(postBuilder.build());
    }

    @Override
    public Post updatePost(Long postId, User author, PostForm form, MultipartFile image) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다."));

        // 작성자 확인
        boolean isAuthor = false;
        if (post.getAuthorUser() != null && post.getAuthorUser().getId().equals(author.getId())) {
            isAuthor = true;
        } else if (post.getAuthorOrgan() != null) {
            Organ organ = organService.findByUserId(author.getId()).orElse(null);
            if (organ != null && organ.getId().equals(post.getAuthorOrgan().getId())) {
                isAuthor = true;
            }
        }
        if (!isAuthor) {
            throw new IllegalStateException("게시물을 수정할 권한이 없습니다.");
        }

        // 여러 이미지 업데이트
        if (form.getImages() != null && !form.getImages().isEmpty()) {
            // 기존 이미지 삭제
            if (post.getImageUrls() != null && !post.getImageUrls().isEmpty()) {
                String[] existingUrls = post.getImageUrls().split(",");
                for (String url : existingUrls) {
                    if (url != null && !url.trim().isEmpty()) {
                        deleteImage(url.trim());
                    }
                }
            } else if (post.getImageUrl() != null) {
                deleteImage(post.getImageUrl());
            }
            
            // 새 이미지 저장
            List<String> savedImageUrls = new java.util.ArrayList<>();
            for (MultipartFile img : form.getImages()) {
                if (img != null && !img.isEmpty()) {
                    try {
                        String savedUrl = saveImage(img);
                        savedImageUrls.add(savedUrl);
                    } catch (IOException e) {
                        log.error("이미지 저장 실패", e);
                        throw new RuntimeException("이미지 저장에 실패했습니다.", e);
                    }
                }
            }
            if (!savedImageUrls.isEmpty()) {
                post.setImageUrls(String.join(",", savedImageUrls));
                post.setImageUrl(savedImageUrls.get(0)); // 첫 번째 이미지를 imageUrl에도 설정 (하위 호환성)
            }
        }
        // 단일 이미지 업데이트 (하위 호환성)
        else if (image != null && !image.isEmpty()) {
            // 기존 이미지 삭제
            if (post.getImageUrls() != null && !post.getImageUrls().isEmpty()) {
                String[] existingUrls = post.getImageUrls().split(",");
                for (String url : existingUrls) {
                    if (url != null && !url.trim().isEmpty()) {
                        deleteImage(url.trim());
                    }
                }
            } else if (post.getImageUrl() != null) {
                deleteImage(post.getImageUrl());
            }
            // 새 이미지 저장
            try {
                String savedUrl = saveImage(image);
                post.setImageUrl(savedUrl);
                post.setImageUrls(savedUrl);
            } catch (IOException e) {
                log.error("이미지 저장 실패", e);
                throw new RuntimeException("이미지 저장에 실패했습니다.", e);
            }
        }

        // 내용 업데이트
        post.setTitle(form.getTitle());
        post.setContent(form.getContent());

        // 타입별 필드 업데이트
        if (form.getPostType() == PostType.DONATION_REVIEW) {
            post.setIsAnonymous(form.getIsAnonymous() != null ? form.getIsAnonymous() : false);
        } else if (form.getPostType() == PostType.ORGAN_REQUEST) {
            post.setReqGenderType(form.getReqGenderType());
            post.setReqMainCategory(form.getReqMainCategory());
            post.setReqDetailCategory(form.getReqDetailCategory());
            post.setReqSize(form.getReqSize());
        }

        return postRepository.save(post);
    }

    @Override
    public void deletePost(Long postId, User author) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다."));

        // 작성자 확인
        boolean isAuthor = false;
        if (post.getAuthorUser() != null && post.getAuthorUser().getId().equals(author.getId())) {
            isAuthor = true;
        } else if (post.getAuthorOrgan() != null) {
            Organ organ = organService.findByUserId(author.getId()).orElse(null);
            if (organ != null && organ.getId().equals(post.getAuthorOrgan().getId())) {
                isAuthor = true;
            }
        }
        if (!isAuthor) {
            throw new IllegalStateException("게시물을 삭제할 권한이 없습니다.");
        }

        // 이미지 삭제
        if (post.getImageUrls() != null && !post.getImageUrls().isEmpty()) {
            String[] imageUrls = post.getImageUrls().split(",");
            for (String url : imageUrls) {
                if (url != null && !url.trim().isEmpty()) {
                    deleteImage(url.trim());
                }
            }
        } else if (post.getImageUrl() != null) {
            deleteImage(post.getImageUrl());
        }

        postRepository.delete(post);
    }

    @Override
    public void deletePostByAdmin(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다."));

        // 이미지 삭제
        if (post.getImageUrls() != null && !post.getImageUrls().isEmpty()) {
            String[] imageUrls = post.getImageUrls().split(",");
            for (String url : imageUrls) {
                if (url != null && !url.trim().isEmpty()) {
                    deleteImage(url.trim());
                }
            }
        } else if (post.getImageUrl() != null) {
            deleteImage(post.getImageUrl());
        }

        postRepository.delete(post);
    }

    @Override
    @Transactional(readOnly = true)
    public Post getPostById(Long postId) {
        return postRepository.findByIdWithAuthors(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다."));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Post> getAllPosts() {
        return postRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Post> getPostsByType(PostType postType) {
        return postRepository.findByPostTypeOrderByCreatedAtDesc(postType);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Post> getPostsByType(PostType postType, Pageable pageable) {
        return postRepository.findByPostType(postType, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Post> getPostsByAuthorUser(User authorUser) {
        return postRepository.findByAuthorUser(authorUser);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Post> getPostsByAuthorOrgan(Long organId) {
        return postRepository.findByAuthorOrganId(organId);
    }

    private String saveImage(MultipartFile image) throws IOException {
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFilename = image.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : "";
        String filename = UUID.randomUUID().toString() + extension;
        Path filePath = uploadPath.resolve(filename);

        Files.copy(image.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        return filename;
    }

    private void deleteImage(String imagePath) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(imagePath);
            if (Files.exists(filePath)) {
                Files.delete(filePath);
            }
        } catch (IOException e) {
            log.error("이미지 삭제 실패: " + imagePath, e);
        }
    }
}