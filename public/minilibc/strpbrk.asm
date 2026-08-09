Bits 64

section .note.GNU-stack noalloc noexec nowrite progbits

section .text
global strpbrk

strpbrk:
    cmp     byte [rdi], 0       ; Check if the first byte is null terminator
    je      end_null         ; If so, end
    cmp     byte [rsi], 0
    je      end_null
    jmp     loop_next_char

loop_next_char:
    cmp     byte [rdi], 0       ; Check if the current byte is null terminator
    je      end_null        ; If so, end
    mov     al, [rdi]           ; Load the byte at [rdi] into AL register
    cmp     al, [rsi]         ; Compare the bytes
    je      end_main_loop
    mov     r10, rdi
    mov     rax, rdi
    mov     r11, rsi
    jne     check_if_two_str_same         ; Continue loop

check_if_two_str_same:
    cmp     byte [r11], 0       ; Check if the current byte is null terminator
    je      str_is_not_present        ; If so, end
    cmp     byte [r10], 0       ; Check if the current byte is null terminator
    je      end_of_str        ; If so, end
    mov     r12b, [r11]
    cmp     r12b, [r10]
    je      str_is_inside
    inc     r11
    jne     check_if_two_str_same

str_is_not_present:
    inc rdi
    jmp loop_next_char

str_is_inside:
    mov rax, r10
    ret

end_main_loop:
    mov rax, rdi
    ret

end_of_str:
    ret

end_null
    mov rax, 0
    ret


