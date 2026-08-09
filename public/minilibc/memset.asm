bits 64

section .note.GNU-stack noalloc noexec nowrite progbits

section .text
global memset
    memset:
        mov     rax, rdi        ; Initialize return value (starting address)
        mov     r10, 0          ; Initialize counter
        cmp     rdx, 0          ; Check if length is 0 (set no character)
        je      end_memset      ; If so, end

    loop_next_char:
        cmp     r10, rdx        ; Compare counter with length
        je      end_memset      ; If equal, end loop
        mov     [rdi], sil      ; Set the current character
        inc     rdi             ; Move to the next character
        inc     r10             ; Increment counter
        jmp     loop_next_char  ; Continue loop

    end_memset:
        ret