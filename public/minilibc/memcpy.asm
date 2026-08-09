bits 64

section .note.GNU-stack noalloc noexec nowrite progbits

section .text
global memcpy
    memcpy:
    mov     rax, rdi             ; Initialize return value (starting address)
    xor     r10, r10               ; Initialize counter
    cmp     rdx, 0               ; Check if length is 0 (set no character)
    je      end_memcpy          ; If so, end
    jmp loop_next_char

    loop_next_char:
        cmp     r10, rdx         ; Compare counter with length
        jge     end_memcpy       ; If equal, end loop
        mov     r11b, [rsi]
        mov     [rdi], r11b       ; Load the contents of the memory location pointed to by rsi into rax
        inc     rdi              ; Move to the next character
        inc     rsi
        inc     r10              ; Increment counter
        jmp     loop_next_char   ; Continue loop

    end_memcpy:
        ret