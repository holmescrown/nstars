struct Star {
    position: vec2<f32>,
    mass: f32,
    color: vec3<f32>,
};

@group(0) @binding(0) var<storage> stars: array<Star>;
@group(0) @binding(1) var<storage> grid_points: array<vec2<f32>>;

// 计算引力势阱对网格的扭曲
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    var total_distortion = vec2<f32>(0.0, 0.0);
    let p = grid_points[id.x];

    for (var i = 0u; i < arrayLength(&stars); i++) {
        let diff = stars[i].position - p;
        let dist = length(diff);
        // 三体引力势阱公式：扭曲度与质量成正比，与距离平方成反比
        let force = stars[i].mass / (dist * dist + 0.1);
        total_distortion += normalize(diff) * force;
    }

    // 将扭曲数据传回顶点着色器，绘制发光粒子轨迹
    update_vertex_position(id.x, p + total_distortion);
}
