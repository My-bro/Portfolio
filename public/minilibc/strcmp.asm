bits 64

section .note.GNU-stack noalloc noexec nowrite progbits

section .text
global strcmp

strcmp:
    xor     rax, rax              ; Initialize return value (starting address)
    mov     al,[rsi]
    cmp     [rdi], al
    jg      end_istrcmp_greater
    jl      end_istrcmp_lower
    jmp     loop_next_char

incrementer:
    inc     rdi
    inc     rsi
    jmp     loop_next_char

loop_next_char:
    cmp     byte [rdi], 0       ; Check if the current byte is null terminator
    je      end_istrcmp         ; If so, end

    mov     al, [rdi]           ; Load the byte at [rdi] into AL register
    cmp     al, [rsi]           ; Compare the bytes
    jg     end_istrcmp_greater         ; If not equal, end
    jl     end_istrcmp_lower
    jmp     incrementer         ; Continue loop

end_istrcmp:
    xor rax, rax
    ret
end_istrcmp_greater:
    mov rax, 1
    ret

end_istrcmp_lower:
    mov rax, -1
    ret
