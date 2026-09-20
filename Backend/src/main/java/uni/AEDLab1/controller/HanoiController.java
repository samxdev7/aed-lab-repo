package uni.AEDLab1.controller;

import org.springframework.web.bind.annotation.*;
import uni.AEDLab1.models.TorresHanoiDto;
import uni.AEDLab1.services.TorresHanoiServicio;
import java.util.List;

@RestController
@RequestMapping("/api/hanoi")
public class HanoiController {

    private TorresHanoiServicio torresHanoiServicio = new TorresHanoiServicio();

    @GetMapping("/resolver/{discos}")
    public List<TorresHanoiDto> resolver(@PathVariable int discos) {
        if (discos < 1 || discos > 7) {
            throw new IllegalArgumentException("El número de discos debe estar entre 1 y 7.");
        }
        return this.torresHanoiServicio.resolverHanoi(discos);
    }
}