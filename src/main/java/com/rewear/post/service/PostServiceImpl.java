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
        // 기관 게시물인 경우 organ 정보 가져오기
        Organ organ = null;
        if (form.getPostType() == PostType.ORGAN_REQUEST) {
            organ = organService.findByUserId(author.getId())
                    .orElseThrow(() -> new IllegalArgumentException("기관 정보를 찾을 수 없습니다."));
        }

        // 이미지 저장
        String imagePath = null;
        if (image != null && !image.isEmpty()) {
            try {
                imagePath = saveImage(image);
            } catch (IOException e) {
                log.error("이미지 저장 실패", e);
                throw new RuntimeException("이미지 저장에 실패했습니다.", e);
            }
        }

        Post post = Post.builder()
                .postType(form.getPostType())
                .author(author)
                .organ(organ)
                .title(form.getTitle())
                .content(form.getContent())
                .clothType(form.getClothType())
                .quantity(form.getQuantity())
                .imagePath(imagePath)
                .viewCount(0)
                .build();

        return postRepository.save(post);
    }

    @Override
    public Post updatePost(Long postId, User author, PostForm form, MultipartFile image) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다."));

        // 작성자 확인
        if (!post.getAuthor().getId().equals(author.getId())) {
            throw new IllegalStateException("게시물을 수정할 권한이 없습니다.");
        }

        // 이미지 업데이트
        if (image != null && !image.isEmpty()) {
            // 기존 이미지 삭제
            if (post.getImagePath() != null) {
                deleteImage(post.getImagePath());
            }
            // 새 이미지 저장
            try {
                post.setImagePath(saveImage(image));
            } catch (IOException e) {
                log.error("이미지 저장 실패", e);
                throw new RuntimeException("이미지 저장에 실패했습니다.", e);
            }
        }

        // 내용 업데이트
        post.setTitle(form.getTitle());
        post.setContent(form.getContent());
        post.setClothType(form.getClothType());
        post.setQuantity(form.getQuantity());

        return postRepository.save(post);
    }

    @Override
    public void deletePost(Long postId, User author) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다."));

        // 작성자 확인
        if (!post.getAuthor().getId().equals(author.getId())) {
            throw new IllegalStateException("게시물을 삭제할 권한이 없습니다.");
        }

        // 이미지 삭제
        if (post.getImagePath() != null) {
            deleteImage(post.getImagePath());
        }

        postRepository.delete(post);
    }

    @Override
    @Transactional(readOnly = true)
    public Post getPostById(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다."));
    }

    @Override
    @Transactional
    public Post getPostByIdAndIncrementView(Long postId) {
        Post post = getPostById(postId);
        post.incrementViewCount();
        return postRepository.save(post);
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
    public List<Post> getPostsByAuthor(User author) {
        return postRepository.findByAuthor(author);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Post> getPostsByOrgan(Long organId) {
        return postRepository.findByOrganId(organId);
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